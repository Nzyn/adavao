import csv
import mysql.connector
from difflib import SequenceMatcher
import os
from dotenv import load_dotenv

# Load environment variables from Laravel .env file
env_path = r'D:\Codes\alertdavao\alertdavao\AdminSide\admin\.env'
if os.path.exists(env_path):
    load_dotenv(env_path)

# Database connection
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USERNAME', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_DATABASE', 'alertdavao')
    )

# Function to normalize barangay names for comparison
def normalize_name(name):
    """Normalize barangay name for comparison"""
    if not name:
        return ""
    # Convert to uppercase, remove extra spaces
    normalized = name.strip().upper()
    # Remove common prefixes/suffixes variations
    normalized = normalized.replace("BRGY ", "").replace("BARANGAY ", "")
    normalized = normalized.replace("(POB)", "").replace("(POB.)", "").replace("POB", "")
    normalized = normalized.strip()
    return normalized

# Function to check if two names are similar
def are_similar(name1, name2, threshold=0.85):
    """Check if two barangay names are similar enough"""
    norm1 = normalize_name(name1)
    norm2 = normalize_name(name2)
    
    # Exact match after normalization
    if norm1 == norm2:
        return True
    
    # Similarity ratio
    ratio = SequenceMatcher(None, norm1, norm2).ratio()
    return ratio >= threshold

# Read CSV file
def read_csv_barangays(csv_path):
    """Read barangay names from CSV file"""
    barangays = []
    try:
        with open(csv_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.reader(file)
            # Skip header
            next(csv_reader, None)
            for row in csv_reader:
                # Barangay name is in column index 2 (3rd column)
                if len(row) > 2 and row[2].strip():
                    barangays.append(row[2].strip())
        print(f"Read {len(barangays)} barangays from CSV file")
        return barangays
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return []

# Get barangays from database
def get_db_barangays():
    """Get all barangays from database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT barangay_name FROM barangays")
    barangays = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    print(f"Found {len(barangays)} barangays in database")
    return barangays

# Compare and find unmatched barangays
def find_unmatched_barangays(csv_barangays, db_barangays):
    """Find database barangays that don't match any CSV barangay"""
    unmatched = []
    
    for db_brgy in db_barangays:
        matched = False
        for csv_brgy in csv_barangays:
            if are_similar(db_brgy, csv_brgy):
                matched = True
                break
        
        if not matched:
            unmatched.append(db_brgy)
    
    return unmatched

# Delete barangays from database
def delete_barangays(barangay_names):
    """Delete specified barangays from database"""
    if not barangay_names:
        print("No barangays to delete")
        return
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    deleted_count = 0
    for brgy in barangay_names:
        try:
            cursor.execute("DELETE FROM barangays WHERE barangay_name = %s", (brgy,))
            deleted_count += cursor.rowcount
        except Exception as e:
            print(f"Error deleting '{brgy}': {e}")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"\nDeleted {deleted_count} barangays from database")

# Main function
def main():
    csv_path = r'D:\Codes\alertdavao\alertdavao\LIST OF BARANGAYS 2024.csv'
    
    print("=== Barangay Comparison Tool ===\n")
    
    # Read CSV barangays
    csv_barangays = read_csv_barangays(csv_path)
    if not csv_barangays:
        print("No barangays found in CSV file. Exiting.")
        return
    
    # Get database barangays
    db_barangays = get_db_barangays()
    if not db_barangays:
        print("No barangays found in database. Exiting.")
        return
    
    # Find unmatched barangays
    print("\nComparing barangays...")
    unmatched = find_unmatched_barangays(csv_barangays, db_barangays)
    
    if not unmatched:
        print("\n✓ All database barangays match CSV barangays. No deletions needed.")
        return
    
    # Display unmatched barangays
    print(f"\n{len(unmatched)} barangays in database do NOT match CSV:")
    print("-" * 60)
    for i, brgy in enumerate(unmatched, 1):
        print(f"{i}. {brgy}")
    
    # Confirm deletion
    print("\n" + "=" * 60)
    confirm = input("Do you want to DELETE these barangays from the database? (yes/no): ")
    
    if confirm.lower() in ['yes', 'y']:
        delete_barangays(unmatched)
        print("\n✓ Cleanup complete!")
    else:
        print("\nDeletion cancelled.")

if __name__ == "__main__":
    main()
