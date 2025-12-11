import re
import sys

def convert_mysql_to_postgres(input_file, output_file):
    """Comprehensive MySQL to PostgreSQL converter"""
    
    print(f"Reading {input_file}...")
    with open(input_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    print("Converting MySQL syntax to PostgreSQL...")
    
    # 1. Remove MySQL-specific comments and metadata
    content = re.sub(r'/\*!.*?\*/;?', '', content, flags=re.DOTALL)
    content = re.sub(r'--.*?$', '', content, flags=re.MULTILINE)  # Remove single-line comments
    
    # 2. Remove SET statements
    content = re.sub(r'SET\s+.*?;', '', content, flags=re.IGNORECASE)
    
    # 3. Remove DROP TABLE statements
    content = re.sub(r'DROP\s+TABLE\s+IF\s+EXISTS.*?;', '', content, flags=re.IGNORECASE)
    
    # 4. Replace backticks with double quotes
    content = content.replace('`', '"')
    
    # 5. Remove 'unsigned' keyword (with word boundaries)
    content = re.sub(r'\bunsigned\b', '', content, flags=re.IGNORECASE)
    
    # Clean up any leftover fragments (standalone UN, SIGNED, etc.)
    content = re.sub(r'^\s*UN\s*$', '', content, flags=re.MULTILINE)
    content = re.sub(r'^\s*SIGNED\s*$', '', content, flags=re.MULTILINE)
    
    # 6. Convert AUTO_INCREMENT to SERIAL/BIGSERIAL
    content = re.sub(r'"id"\s+bigint\s+NOT\s+NULL\s+AUTO_INCREMENT', '"id" BIGSERIAL PRIMARY KEY', content, flags=re.IGNORECASE)
    content = re.sub(r'"id"\s+int\s+NOT\s+NULL\s+AUTO_INCREMENT', '"id" SERIAL PRIMARY KEY', content, flags=re.IGNORECASE)
    
    # Remove ENGINE, CHARSET, COLLATE, COMMENT, AUTO_INCREMENT=value (Order matters!)
    # First remove key=value patterns
    content = re.sub(r'ENGINE\s*=\s*\w+', '', content, flags=re.IGNORECASE)
    content = re.sub(r'DEFAULT\s+CHARSET\s*=\s*\w+', '', content, flags=re.IGNORECASE)
    content = re.sub(r'CHARACTER\s+SET\s+\w+', '', content, flags=re.IGNORECASE)  # Remove column-level CHARACTER SET
    content = re.sub(r'COLLATE\s*=\s*\w+', '', content, flags=re.IGNORECASE)
    content = re.sub(r'COLLATE\s+\w+', '', content, flags=re.IGNORECASE)
    content = re.sub(r'AUTO_INCREMENT\s*=\s*\d+', '', content, flags=re.IGNORECASE)
    content = re.sub(r'COMMENT\s*=\s*\'[^\']*\'', '', content, flags=re.IGNORECASE)
    content = re.sub(r'COMMENT\s*=\s*"[^"]*"', '', content, flags=re.IGNORECASE)
    content = re.sub(r'COMMENT\s+\'[^\']*\'', '', content, flags=re.IGNORECASE)
    content = re.sub(r'ROW_FORMAT\s*=\s*\w+', '', content, flags=re.IGNORECASE)
    
    # Then remove standalone keywords
    content = re.sub(r'\s+AUTO_INCREMENT', '', content, flags=re.IGNORECASE)
    content = re.sub(r'\bunsigned\b', '', content, flags=re.IGNORECASE)
    
    # Convert data types
    content = re.sub(r'bigint\(\d+\)', 'BIGINT', content, flags=re.IGNORECASE)
    content = re.sub(r'int\(\d+\)', 'INTEGER', content, flags=re.IGNORECASE)
    content = re.sub(r'smallint\(\d+\)', 'SMALLINT', content, flags=re.IGNORECASE)
    content = re.sub(r'tinyint\(1\)', 'BOOLEAN', content, flags=re.IGNORECASE)
    content = re.sub(r'tinyint\(\d+\)', 'SMALLINT', content, flags=re.IGNORECASE)
    content = re.sub(r'mediumint\(\d+\)', 'INTEGER', content, flags=re.IGNORECASE)
    content = re.sub(r'datetime', 'TIMESTAMP', content, flags=re.IGNORECASE)
    content = re.sub(r'longtext', 'TEXT', content, flags=re.IGNORECASE)
    content = re.sub(r'mediumtext', 'TEXT', content, flags=re.IGNORECASE)
    content = re.sub(r'tinytext', 'TEXT', content, flags=re.IGNORECASE)
    content = re.sub(r'double\s+precision', 'DOUBLE PRECISION', content, flags=re.IGNORECASE)
    content = re.sub(r'double\(\d+,\d+\)', 'DOUBLE PRECISION', content, flags=re.IGNORECASE)
    content = re.sub(r'varchar\((\d+)\)', r'VARCHAR(\1)', content, flags=re.IGNORECASE)
    
    # Remove KEY definitions
    content = re.sub(r',\s*KEY\s+"[^"]*"\s*\([^)]+\)', '', content, flags=re.IGNORECASE)
    content = re.sub(r',\s*UNIQUE\s+KEY\s+"[^"]*"\s*\([^)]+\)', '', content, flags=re.IGNORECASE)
    content = re.sub(r',\s*PRIMARY\s+KEY\s*\([^)]+\)', '', content, flags=re.IGNORECASE)
    content = re.sub(r',\s*FULLTEXT\s+KEY\s+"[^"]*"\s*\([^)]+\)', '', content, flags=re.IGNORECASE)
    content = re.sub(r',\s*SPATIAL\s+KEY\s+"[^"]*"\s*\([^)]+\)', '', content, flags=re.IGNORECASE)
    
    # Remove CONSTRAINT definitions
    content = re.sub(r',\s*CONSTRAINT\s+"[^"]*"[^)]*\)', '', content, flags=re.IGNORECASE | re.DOTALL)
    
    # Fix INSERT statements
    content = re.sub(r'ON\s+DUPLICATE\s+KEY\s+UPDATE.*?;', ';', content, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove LOCK/UNLOCK TABLES
    content = re.sub(r'LOCK\s+TABLES.*?;', '', content, flags=re.IGNORECASE)
    content = re.sub(r'UNLOCK\s+TABLES;', '', content, flags=re.IGNORECASE)
    
    # Remove trailing commas before closing parenthesis
    content = re.sub(r',\s*\)', ')', content)
    
    # Fix enum types
    content = re.sub(r'enum\([^)]+\)', 'VARCHAR(50)', content, flags=re.IGNORECASE)
    
    # Remove DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    content = re.sub(r'DEFAULT\s+CURRENT_TIMESTAMP\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP', 'DEFAULT CURRENT_TIMESTAMP', content, flags=re.IGNORECASE)
    
    # Convert zero dates
    content = content.replace("'0000-00-00 00:00:00'", "NULL")
    content = content.replace("'0000-00-00'", "NULL")
    
    # Line-by-line cleanup to remove garbage
    lines = content.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        # Skip lines that are just garbage
        if stripped in ['UN', 'SIGNED', 'LOCK TABLES', 'UNLOCK TABLES']:
            continue
        if re.match(r'^\s*\)\s*=\d+\s*;\s*$', line): # matches ") =7 ;"
            cleaned_lines.append(');')
            continue
        if re.match(r'^\s*=\d+\s*;\s*$', line): # matches "=7 ;"
            # likely appended to previous line, but if standalone, skip or fix
            continue
        # Clean up lines ending with garbage like ") =123 ;"
        line = re.sub(r'\)\s*=\d+\s*;', ');', line)
        
        cleaned_lines.append(line)
        
    content = '\n'.join(cleaned_lines)
    
    # Final cleanup of multiple blank lines
    content = re.sub(r'\n{3,}', '\n\n', content)

    # Fix tinyINTEGER artifact
    content = content.replace('tinyINTEGER', 'SMALLINT')

    # Move critical tables to the top to fix Foreign Key dependency issues
    # Order matters: referenced tables must come first
    tables_to_move = ["user_admin", "admin_roles", "police_stations"]
    moved_blocks = []
    
    for table in tables_to_move:
        match = re.search(r'CREATE TABLE "' + table + r'" \(.*?\);', content, flags=re.DOTALL)
        if match:
            block = match.group(0)
            content = content.replace(block, '')
            moved_blocks.append(block)
            print(f"✓ Moved '{table}' table to the top queue.")
        else:
            print(f"⚠️ Warning: '{table}' table not found for reordering.")
            
    # Prepend them in correct order (referenced tables first)
    if moved_blocks:
        content = "\n\n".join(moved_blocks) + "\n\n" + content
    
    # Add PostgreSQL-specific header
    postgres_header = """-- Converted from MySQL to PostgreSQL
-- Conversion date: """ + str(__import__('datetime').datetime.now()) + """

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;
SET session_replication_role = 'replica';

"""
    
    content = postgres_header + content
    
    print(f"Writing to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Conversion complete!")
    print(f"✓ Converted {input_file} → {output_file}")
    print(f"✓ Ready to import to PostgreSQL")

if __name__ == "__main__":
    input_file = "alertdavao.sql"
    output_file = "alertdavao_postgres_v4.sql"
    
    try:
        convert_mysql_to_postgres(input_file, output_file)
    except FileNotFoundError:
        print(f"❌ Error: {input_file} not found!")
        print("Make sure alertdavao.sql is in the same directory as this script.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
