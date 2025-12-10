import re
import sys

def convert_mysql_to_postgres(input_file, output_file):
    """Convert MySQL dump to PostgreSQL-compatible SQL"""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove MySQL-specific comments
    content = re.sub(r'/\*!.*?\*/;', '', content, flags=re.DOTALL)
    
    # Remove SET statements
    content = re.sub(r'SET .*?;', '', content)
    
    # Remove backticks
    content = content.replace('`', '"')
    
    # Convert AUTO_INCREMENT to SERIAL
    content = re.sub(r'"id" bigint\(20\) unsigned NOT NULL AUTO_INCREMENT', '"id" BIGSERIAL PRIMARY KEY', content)
    content = re.sub(r'"id" int\(11\) NOT NULL AUTO_INCREMENT', '"id" SERIAL PRIMARY KEY', content)
    
    # Remove ENGINE and CHARSET
    content = re.sub(r'ENGINE=\w+', '', content)
    content = re.sub(r'DEFAULT CHARSET=\w+', '', content)
    content = re.sub(r'COLLATE=\w+', '', content)
    
    # Convert data types
    content = content.replace('bigint(20)', 'BIGINT')
    content = content.replace('int(11)', 'INTEGER')
    content = content.replace('tinyint(1)', 'BOOLEAN')
    content = content.replace('datetime', 'TIMESTAMP')
    content = content.replace('longtext', 'TEXT')
    content = content.replace('mediumtext', 'TEXT')
    
    # Remove KEY definitions (will be recreated by migrations)
    content = re.sub(r',\s*KEY ".*?".*?\)', '', content)
    content = re.sub(r',\s*UNIQUE KEY ".*?".*?\)', '', content)
    content = re.sub(r',\s*PRIMARY KEY \("id"\)', '', content)  # Already handled by SERIAL
    
    # Remove CONSTRAINT definitions (will be recreated by migrations)
    content = re.sub(r',\s*CONSTRAINT ".*?".*?\)', '', content)
    
    # Fix INSERT statements - remove ON DUPLICATE KEY UPDATE
    content = re.sub(r'ON DUPLICATE KEY UPDATE.*?;', ';', content, flags=re.DOTALL)
    
    # Convert LOCK/UNLOCK TABLES
    content = re.sub(r'LOCK TABLES.*?;', '', content)
    content = re.sub(r'UNLOCK TABLES;', '', content)
    
    # Add PostgreSQL-specific commands
    postgres_header = """
-- Converted from MySQL to PostgreSQL
SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

"""
    
    content = postgres_header + content
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Converted {input_file} to {output_file}")
    print(f"✓ Ready to import to PostgreSQL")

if __name__ == "__main__":
    input_file = "alertdavao.sql"
    output_file = "alertdavao_postgres.sql"
    
    try:
        convert_mysql_to_postgres(input_file, output_file)
    except FileNotFoundError:
        print(f"Error: {input_file} not found!")
        print("Make sure alertdavao.sql is in the same directory as this script.")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
