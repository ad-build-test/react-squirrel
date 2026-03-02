/**
 * CSV Parser Utility for PV Import
 * Converts CSV file data into format suitable for bulk PV import
 *
 * Matches the Python implementation in squirrel/utils.py
 */

export interface ParsedCSVRow {
  Setpoint: string;
  Readback: string;
  Device: string;
  Description: string;
  groups: Record<string, string[]>; // Tag group name -> tag values
}

export interface ParsedCSVResult {
  data: ParsedCSVRow[];
  groupColumns: string[]; // List of tag group column names found in CSV
  errors: string[];
}

export interface ParseProgress {
  processedRows: number;
  totalRows: number;
  status: 'parsing' | 'validating' | 'complete';
}

/**
 * Parse a single CSV line, handling quoted fields
 * Simple CSV parser that handles basic quoting
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = i + 1 < line.length ? line[i + 1] : '';

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 1; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

/**
 * Async CSV parser with progress feedback for large files
 * Processes the file in chunks to prevent UI blocking and provides progress updates
 *
 * @param csvContent - Raw CSV file content as string
 * @param onProgress - Optional callback for progress updates (processedRows, totalRows, status)
 * @returns Parsed PV data with tag groups and any errors
 */
export async function parseCSVToPVsAsync(
  csvContent: string,
  onProgress?: (progress: ParseProgress) => void
): Promise<ParsedCSVResult> {
  const errors: string[] = [];
  const data: ParsedCSVRow[] = [];

  // Split into lines and filter empty lines
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length === 0) {
    errors.push('CSV file is empty');
    return { data, groupColumns: [], errors };
  }

  // Parse header row
  const rawHeaders = parseCSVLine(lines[0]);
  const cleanedHeaders = rawHeaders.map((h) => h.trim()).filter((h) => h);

  if (cleanedHeaders.length === 0) {
    errors.push('CSV header row is empty');
    return { data, groupColumns: [], errors };
  }

  // Validate required columns
  if (!cleanedHeaders.includes('Setpoint') && !cleanedHeaders.includes('Readback')) {
    errors.push('Header missing required columns "Setpoint" or "Readback"');
    return { data, groupColumns: [], errors };
  }

  // Identify tag group columns (any column that's not a standard field)
  const standardColumns = ['Setpoint', 'Readback', 'Device', 'Description'];
  const groupColumns = cleanedHeaders.filter((col) => !standardColumns.includes(col));

  // Process data rows in chunks to prevent blocking
  const totalRows = lines.length - 1; // Exclude header
  const chunkSize = 100; // Process 100 rows at a time

  for (let start = 1; start < lines.length; start += chunkSize) {
    const chunkEnd = Math.min(start + chunkSize, lines.length);
    const chunkLines = lines.slice(start, chunkEnd);

    // Process chunk
    for (let i = 0; i < chunkLines.length; i += 1) {
      const line = chunkLines[i].trim();
      if (line) {
        const rowValues = parseCSVLine(line);

        // Create a row dictionary
        const rowDict: Record<string, string> = {};
        cleanedHeaders.forEach((header, index) => {
          rowDict[header] = index < rowValues.length ? rowValues[index].trim() : '';
        });

        const setpoint = rowDict.Setpoint || '';
        const readback = rowDict.Readback || '';

        // Only process row if at least one of setpoint or readback is present
        if (setpoint || readback) {
          const device = rowDict.Device || '';
          const description = rowDict.Description || '';

          // Parse tag groups
          const groups: Record<string, string[]> = {};

          groupColumns.forEach((groupName) => {
            const cellValue = rowDict[groupName] || '';
            const trimmedValue = cellValue.trim();

            if (
              trimmedValue &&
              trimmedValue.toLowerCase() !== 'nan' &&
              trimmedValue.toLowerCase() !== 'none'
            ) {
              // Split comma-separated values and filter
              const tagValues = trimmedValue
                .split(',')
                .map((val) => val.trim())
                .filter((val) => val);
              groups[groupName] = tagValues;
            } else {
              groups[groupName] = [];
            }
          });

          data.push({
            Setpoint: setpoint,
            Readback: readback,
            Device: device,
            Description: description,
            groups,
          });
        }
      }
    }

    // Report progress and yield control to prevent blocking
    const processedRows = Math.min(start + chunkLines.length - 1, totalRows);
    if (onProgress) {
      onProgress({
        processedRows,
        totalRows,
        status: 'parsing',
      });
    }

    // Yield control to allow UI updates
    // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return {
    data,
    groupColumns,
    errors,
  };
}

/**
 * Create tag mapping from CSV groups to backend tag IDs
 * Matches Python _create_tag_mapping_from_csv
 *
 * @param csvGroups - Tag groups from CSV (group name -> tag values)
 * @param tagDef - Backend tag definition (group name -> tags with IDs)
 * @returns Validation results with accepted tag IDs and rejected values
 */
export interface TagMappingResult {
  tagIds: string[]; // Flat list of accepted tag IDs
  validGroups: Record<string, string[]>; // Group name -> valid tag IDs for that group
  rejectedGroups: string[]; // Group names that don't exist in backend
  rejectedValues: Record<string, string[]>; // Group name -> rejected tag values
}

export function createTagMapping(
  csvGroups: Record<string, string[]>,
  availableTagGroups: Array<{ id: string; name: string; tags: Array<{ id: string; name: string }> }>
): TagMappingResult {
  const tagIds: string[] = [];
  const validGroups: Record<string, string[]> = {};
  const rejectedGroups: string[] = [];
  const rejectedValues: Record<string, string[]> = {};

  // Process each CSV group
  Object.entries(csvGroups).forEach(([groupName, csvValues]) => {
    // Find matching tag group in backend
    const matchingGroup = availableTagGroups.find((g) => g.name === groupName);

    if (!matchingGroup) {
      // Group doesn't exist in backend
      rejectedGroups.push(groupName);
      return;
    }

    const groupTagIds: string[] = [];
    const rejectedValuesForGroup: string[] = [];

    // For each CSV value, try to find matching tag in backend
    csvValues.forEach((csvValue) => {
      const matchingTag = matchingGroup.tags.find((t) => t.name === csvValue);

      if (matchingTag) {
        groupTagIds.push(matchingTag.id);
        tagIds.push(matchingTag.id);
      } else {
        rejectedValuesForGroup.push(csvValue);
      }
    });

    if (groupTagIds.length > 0) {
      validGroups[matchingGroup.name] = groupTagIds;
    }

    if (rejectedValuesForGroup.length > 0) {
      rejectedValues[matchingGroup.name] = rejectedValuesForGroup;
    }
  });

  return {
    tagIds,
    validGroups,
    rejectedGroups,
    rejectedValues,
  };
}

/**
 * Create validation summary message
 * Matches Python _create_validation_summary
 */
export function createValidationSummary(
  rejectedGroups: string[],
  rejectedValues: Record<string, string[]>
): string {
  const summaryParts: string[] = [];

  if (rejectedGroups.length > 0) {
    summaryParts.push(`Rejected groups: ${rejectedGroups.join(', ')}`);
  }

  if (Object.keys(rejectedValues).length > 0) {
    const valueParts: string[] = [];
    Object.entries(rejectedValues).forEach(([groupName, values]) => {
      valueParts.push(`${groupName}: ${values.sort().join(', ')}`);
    });
    summaryParts.push(`Rejected values: ${valueParts.join(' | ')}`);
  }

  return summaryParts.length > 0 ? summaryParts.join(' • ') : 'All groups and values are valid';
}
