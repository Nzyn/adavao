import re
import csv
import os
import ast

def parse_values(values_str):
    """
    Parses a MySQL VALUES string like "(1, 'a', NULL), (2, 'b', '2023-01-01')"
    Returns a list of rows, where each row is a list of values.
    """
    rows = []
    current_row = []
    in_string = False
    quote_char = None
    buffer = ""
    
    # Simple state machine to parse the complex nested structure
    # This is a specialized parser for SQL dump format
    i = 0
    while i < len(values_str):
        char = values_str[i]
        
        if in_string:
            if char == quote_char:
                # Check for escaped quote
                if i + 1 < len(values_str) and values_str[i+1] == quote_char:
                    buffer += char
                    i += 1 # Skip next quote
                else:
                    in_string = False
            elif char == '\\':
                # Handle escapes
                if i + 1 < len(values_str):
                    next_char = values_str[i+1]
                    if next_char == 'n': buffer += '\n'
                    elif next_char == 'r': buffer += '\r'
                    elif next_char == 't': buffer += '\t'
                    elif next_char == '\\': buffer += '\\'
                    elif next_char == "'": buffer += "'"
                    elif next_char == '"': buffer += '"'
                    else: buffer += next_char
                    i += 1
            else:
                buffer += char
        else:
            if char == '(' and not current_row:
                # Start of a new row group
                pass
            elif char == ')' and current_row:
                # End of a row group (check logic, usually logic is buffer dump)
                # Actually, simpler logic:
                # We collect values separated by commas.
                pass
            
            # Re-thinking parser: splitting by regex might be safer for standard dumps?
            # Or use a library? No external libs allowed.
            pass
            
    # Fallback: Regex splitting for standard dumps looks like:
    # (val1, val2, val3), (val1, val2, val3)
    # But values can contain commas.
    
    # Let's use a simpler heuristic for typical mysqldump output:
    # It uses single quotes for strings.
    
    # We will iterate and build objects.
    
    return []

# Better approach: Regex to find (...) blocks, then split.
# But (...) can contain ) inside strings.
# A char-by-char parser is best.

def extract_rows(insert_content):
    """
    Extracts individual rows from the VALUES part of an INSERT statement.
    """
    rows = []
    idx = 0
    length = len(insert_content)
    
    while idx < length:
        # Scan for start of row '('
        if insert_content[idx] != '(':
            idx += 1
            continue
            
        # Inside a row
        row_values = []
        idx += 1 # skip (
        
        val_buffer = ""
        in_quote = False
        quote_char = ''
        
        while idx < length:
            char = insert_content[idx]
            
            if in_quote:
                if char == '\\':
                    # Escape next char
                    if idx + 1 < length:
                        next_c = insert_content[idx+1]
                        val_buffer += next_c # Keep simple or map? CSV handler will handle quotes.
                        # Actually for CSV, we want the raw string content.
                        idx += 1
                elif char == quote_char:
                    # Potential end of quote
                    # Check if it is '' (escaped quote in SQL usually uses backslash, but sometimes '')
                    in_quote = False
                else:
                    val_buffer += char
            else:
                if char == "'" or char == '"':
                    in_quote = True
                    quote_char = char
                elif char == ',':
                    row_values.append(clean_val(val_buffer))
                    val_buffer = ""
                elif char == ')':
                    # End of row
                    row_values.append(clean_val(val_buffer))
                    rows.append(row_values)
                    idx += 1
                    break # Break inner loop, look for next row
                else:
                    val_buffer += char
            
            idx += 1
            
        # Verify if we have a comma or duplicate delimiter
        if idx < length and insert_content[idx] == ',':
            idx += 1

    return rows

def clean_val(val):
    val = val.strip()
    if val.upper() == 'NULL':
        return None
    val = val.replace("\\'", "'").replace('\\"', '"').replace('\\n', '\n')
    return val


def main():
    input_file = 'alertdavao.sql'
    output_dir = 'csv_exports'
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    print(f"Reading {input_file}...")
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        with open(input_file, 'r', encoding='latin-1') as f:
            content = f.read()

    # Find table definitions to map names
    # Actually just find INSERT INTO `table`
    
    # Regex to find INSERT blocks
    # INSERT INTO `admin_audit_log` VALUES (1, ...), (2, ...);
    
    matches = re.finditer(r'INSERT INTO [`"]?(\w+)[`"]?(\s+\([^)]+\))?\s+VALUES\s+(.*?);', content, flags=re.DOTALL | re.IGNORECASE)
    
    seen_tables = set()

    for match in matches:
        table_name = match.group(1)
        values_content = match.group(3)
        
        print(f"Processing table: {table_name}")
        
        rows = extract_rows(values_content)
        
        csv_path = os.path.join(output_dir, f"{table_name}.csv")
        
        mode = 'a' if table_name in seen_tables else 'w'
        seen_tables.add(table_name)

        if rows:
            with open(csv_path, mode, newline='', encoding='utf-8') as f:
                writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
                writer.writerows(rows)
            print(f"  -> {'Appended' if mode == 'a' else 'Saved'} {len(rows)} rows to {csv_path}")
        else:
            print("  -> No rows found.")

if __name__ == "__main__":
    main()
