import os
import argparse
import sys

# Ensure app is in path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.db.session import SessionLocal
from app.db.repositories import IngestionRepository
from app.agents.ingestion import process_okf_data

def read_file(filepath: str) -> str:
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()

def main():
    parser = argparse.ArgumentParser(description="Ingest OKF data packages into the AMR-Guard DB.")
    parser.add_argument("--dir", type=str, required=True, help="Directory containing OKF CSV/MD files.")
    parser.add_argument("--type", type=str, choices=["drugs", "rules"], required=True, help="Type of data to ingest.")
    
    args = parser.parse_args()
    target_dir = args.dir
    data_type = args.type
    
    if not os.path.exists(target_dir):
        print(f"Error: Directory {target_dir} does not exist.")
        sys.exit(1)

    print(f"Starting ingestion for {data_type} from {target_dir}...")
    
    combined_content = ""
    for root, _, files in os.walk(target_dir):
        for file in files:
            if file.endswith((".csv", ".md")):
                path = os.path.join(root, file)
                print(f"Reading {path}...")
                combined_content += f"\n\n--- FILE: {file} ---\n"
                combined_content += read_file(path)
                
    if not combined_content.strip():
        print("No valid CSV or MD files found.")
        sys.exit(1)
        
    print("Sending content to LLM agent for normalization (Stochastic Edge)...")
    try:
        normalized_data = process_okf_data(combined_content, data_type)
    except Exception as e:
        print(f"Error during LLM extraction: {e}")
        sys.exit(1)
        
    db = SessionLocal()
    repo = IngestionRepository(db)
    
    try:
        if data_type == "drugs":
            for drug in normalized_data.drugs:
                repo.upsert_drug(drug)
                print(f"Upserted drug: {drug.generic_name}")
        elif data_type == "rules":
            for rule in normalized_data.rules:
                repo.upsert_rule(rule)
                print(f"Upserted rule: {rule.code}")
        
        print("Ingestion complete!")
    except Exception as e:
        db.rollback()
        print(f"Database error during upsert: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
