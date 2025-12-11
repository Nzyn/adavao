import re
import sys
import os

def create_schema_only(input_file, output_file):
    print(f"Reading {input_file}...")
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(input_file, 'r', encoding='latin-1') as f:
            content = f.read()

    print("Extracting Schema (removing data and deferring constraints)...")
    
    # 1. PROCESS LINE BY LINE
    lines = content.split('\n')
    cleaned_lines = []
    foreign_keys = []
    
    in_insert = False
    current_table = None
    
    for line in lines:
        stripped = line.strip()
        
        # Track current table
        if stripped.upper().startswith('CREATE TABLE'):
            # CREATE TABLE `table` (
            match = re.search(r'CREATE TABLE\s+[`"]?(\w+)[`"]?', stripped, re.IGNORECASE)
            if match:
                current_table = match.group(1)
                
        # Skip Comments/Empty
        if stripped.startswith('--') or stripped.startswith('/*') or not stripped:
            continue

        # FILTER: Remove all INSERT statements
        if stripped.upper().startswith('INSERT INTO') or in_insert:
            if stripped.endswith(';'):
                in_insert = False
            else:
                in_insert = True
            continue

        # FILTER: Remove SET/LOCK/UNLOCK statements
        if stripped.upper().startswith('SET ') and 'SQL_MODE' in stripped.upper(): continue
        if stripped.upper().startswith('SET ') and 'TIME_ZONE' in stripped.upper(): continue
        if stripped.upper().startswith('LOCK TABLES'): continue
        if stripped.upper().startswith('UNLOCK TABLES'): continue
        
        # STRATEGY: Strip inline Foreign Keys (REFERENCES)
        # CASE 1: CONSTRAINT `name` FOREIGN KEY ...
        if stripped.upper().startswith('CONSTRAINT') and 'FOREIGN KEY' in stripped.upper():
            # Extract and store for later
            # Convert MySQL backticks to double quotes locally
            pg_fk = line.replace('`', '"').strip().rstrip(',')
            if current_table:
                foreign_keys.append((current_table, pg_fk))
            continue # REMOVE from CREATE TABLE block

        # CASE 2: Inline REFERENCES
        # col_name type ... REFERENCES parent(id) ...
        # This is harder to extract perfectly without a parser, but we can try to strip the references part
        # or comment it out?
        # Better: Most dumps use separate CONSTRAINT lines. If inline exists, it's usually:
        # parent_id bigint REFERENCES parent(id)
        # We can replace 'REFERENCES parent(id)' with nothing, but we lose the constraint.
        # But wait, earlier we saw regex cleanups were FAILING on this.
        
        # Let's hope the dump uses CONSTRAINT lines for FKs (standard mysqldump).
        # Inspecting previous output showed: CONSTRAINT `fk` FOREIGN KEY ...
        
        cleaned_lines.append(line)

    content = '\n'.join(cleaned_lines)
    
    # 2. GLOBAL REGEX CLEANUPS
    
    # Basic replacements
    content = content.replace('`', '"')
    
    # Unsigned
    content = re.sub(r'\bunsigned\b', '', content, flags=re.IGNORECASE)
    
    # Data Types
    content = re.sub(r'bigint\(\d+\)', 'BIGINT', content, flags=re.IGNORECASE)
    content = re.sub(r'int\(\d+\)', 'INTEGER', content, flags=re.IGNORECASE)
    content = re.sub(r'tinyint\(1\)', 'BOOLEAN', content, flags=re.IGNORECASE)
    content = re.sub(r'tinyint\(\d+\)', 'SMALLINT', content, flags=re.IGNORECASE)
    content = re.sub(r'smallint\(\d+\)', 'SMALLINT', content, flags=re.IGNORECASE)
    content = re.sub(r'mediumint\(\d+\)', 'INTEGER', content, flags=re.IGNORECASE)
    content = re.sub(r'datetime', 'TIMESTAMP', content, flags=re.IGNORECASE)
    content = re.sub(r'longtext', 'TEXT', content, flags=re.IGNORECASE)
    content = re.sub(r'mediumtext', 'TEXT', content, flags=re.IGNORECASE)
    content = re.sub(r'tinytext', 'TEXT', content, flags=re.IGNORECASE)
    content = re.sub(r'double\s+precision', 'DOUBLE PRECISION', content, flags=re.IGNORECASE)
    content = re.sub(r'double\(\d+,\d+\)', 'DOUBLE PRECISION', content, flags=re.IGNORECASE)
    content = re.sub(r'varchar\((\d+)\)', r'VARCHAR(\1)', content, flags=re.IGNORECASE)
    content = re.sub(r'enum\([^)]+\)', 'VARCHAR(50)', content, flags=re.IGNORECASE)
    
    # Auto Increment
    content = re.sub(r'"id"\s+bigint\s+NOT\s+NULL\s+AUTO_INCREMENT', '"id" BIGSERIAL PRIMARY KEY', content, flags=re.IGNORECASE)
    content = re.sub(r'"id"\s+int\s+NOT\s+NULL\s+AUTO_INCREMENT', '"id" SERIAL PRIMARY KEY', content, flags=re.IGNORECASE)
    content = re.sub(r'\s+AUTO_INCREMENT', '', content, flags=re.IGNORECASE)
    
    # Remove MySQL-specifics
    content = re.sub(r'ENGINE\s*=\s*\w+', '', content, flags=re.IGNORECASE)
    content = re.sub(r'DEFAULT\s+CHARSET\s*=\s*\w+', '', content, flags=re.IGNORECASE)
    content = re.sub(r'CHARACTER\s+SET\s+\w+', '', content, flags=re.IGNORECASE)
    content = re.sub(r'COLLATE\s*=\s*\w+', '', content, flags=re.IGNORECASE)
    content = re.sub(r'COLLATE\s+\w+', '', content, flags=re.IGNORECASE)
    content = re.sub(r'AUTO_INCREMENT\s*=\s*\d+', '', content, flags=re.IGNORECASE)
    content = re.sub(r'COMMENT\s*=\s*\'[^\']*\'', '', content, flags=re.IGNORECASE)
    content = re.sub(r'COMMENT\s*=\s*"[^"]*"', '', content, flags=re.IGNORECASE)
    content = re.sub(r"COMMENT\s+'[^']*'", "", content, flags=re.IGNORECASE) 
    content = re.sub(r'COMMENT\s+"[^"]*"', '', content, flags=re.IGNORECASE)
    content = re.sub(r'ROW_FORMAT\s*=\s*\w+', '', content, flags=re.IGNORECASE)
    
    # Keys/Indexes
    content = re.sub(r',\s*KEY\s+"[^"]*"\s*\([^)]+\)', '', content, flags=re.IGNORECASE)
    content = re.sub(r',\s*UNIQUE\s+KEY\s+"[^"]*"\s*\([^)]+\)', '', content, flags=re.IGNORECASE)
    content = re.sub(r',\s*PRIMARY\s+KEY\s*\([^)]+\)', '', content, flags=re.IGNORECASE)
    content = re.sub(r',\s*FULLTEXT\s+KEY\s+"[^"]*"\s*\([^)]+\)', '', content, flags=re.IGNORECASE)
    content = re.sub(r',\s*SPATIAL\s+KEY\s+"[^"]*"\s*\([^)]+\)', '', content, flags=re.IGNORECASE)
    
    # Cleanups
    content = re.sub(r',\s*\)', ')', content)
    content = re.sub(r'DEFAULT\s+CURRENT_TIMESTAMP\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP', 'DEFAULT CURRENT_TIMESTAMP', content, flags=re.IGNORECASE)
    content = content.replace("'0000-00-00 00:00:00'", "NULL")
    content = content.replace("'0000-00-00'", "NULL")
    content = content.replace('tinyINTEGER', 'SMALLINT')
    
    # Remove known garbage lines
    content = re.sub(r'^\s*UN\s*$', '', content, flags=re.MULTILINE)
    content = re.sub(r'^\s*SIGNED\s*$', '', content, flags=re.MULTILINE)

    # Line filtering for garbage (like '=7' artifacts)
    lines = content.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        
        # Aggressive cleanup for table closing garbage like: ) =7 ; or ) DEFAULT CHAR... ;
        # Match anything starting with ) followed by = and numbers
        if re.search(r'^\)\s*=\s*\d+\s*;?$', stripped): 
            cleaned_lines.append(');')
            continue
            
        # Match ) followed by various MySQL table options
        if stripped.startswith(')') and ('ENGINE=' in stripped.upper() or 'CHARSET=' in stripped.upper()):
             cleaned_lines.append(');')
             continue

        # Final cleanup for inline garbage on the same line
        # e.g. ...TIMESTAMP) =7 ;
        line = re.sub(r'\)\s*=\s*\d+\s*;', ');', line)
        if stripped and stripped != ');' and re.match(r'^=\d+\s*;$', stripped):
            continue
            
        cleaned_lines.append(line)
    content = '\n'.join(cleaned_lines)

    # 3. APPEND DEFERRED CONSTRAINTS
    if foreign_keys:
        content += "\n\n-- ==========================================\n"
        content += "-- DEFERRED FOREIGN KEYS (At end to avoid loops)\n"
        content += "-- ==========================================\n"
        for table, fk_def in foreign_keys:
            # fk_def looks like: CONSTRAINT "fk_name" FOREIGN KEY ("col") REFERENCES "parent" ("id")
            # We want: ALTER TABLE "table" ADD CONSTRAINT ...
            content += f'ALTER TABLE "{table}" ADD {fk_def};\n'

    # Header
    postgres_header = """-- AlertDavao PostgreSQL Schema (Reference only)
-- GENERATED: Deferred Constraints Mode (Robust)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

"""
    content = postgres_header + content
    
    print(f"Writing schema to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✓ Schema generation complete.")

if __name__ == "__main__":
    create_schema_only("alertdavao.sql", "alertdavao_schema_v3.sql")
