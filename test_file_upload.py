#!/usr/bin/env python3
"""
Test script for file upload functionality
"""

import requests
import json
import os
from pathlib import Path

# Configuration
BASE_URL = "http://127.0.0.1:8000"
TEST_TOKEN = "your_test_token_here"  # Replace with actual test token

def test_file_upload():
    """Test the file upload endpoint"""
    
    # Test file upload endpoint
    upload_url = f"{BASE_URL}/api/file-upload/"
    
    # Create a test file
    test_file_path = "test_document.txt"
    with open(test_file_path, "w") as f:
        f.write("This is a test financial document for upload testing.")
    
    try:
        # Prepare the upload
        files = {
            'files': ('test_document.txt', open(test_file_path, 'rb'), 'text/plain')
        }
        
        data = {
            'company_context': 'AAPL',
            'description': 'Test upload for financial analysis',
            'upload_timestamp': '2024-01-01T00:00:00Z'
        }
        
        headers = {
            'Authorization': f'Bearer {TEST_TOKEN}'
        }
        
        print("Testing file upload...")
        response = requests.post(upload_url, files=files, data=data, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ File upload test PASSED")
        else:
            print("❌ File upload test FAILED")
            
    except Exception as e:
        print(f"❌ File upload test ERROR: {str(e)}")
    
    finally:
        # Clean up test file
        if os.path.exists(test_file_path):
            os.remove(test_file_path)

def test_chat_with_context():
    """Test the chatbot with file context"""
    
    chat_url = f"{BASE_URL}/api/chat/"
    
    try:
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {TEST_TOKEN}'
        }
        
        payload = {
            "question": "What can you tell me about the financial documents I uploaded?",
            "payload": {
                "companies": ["AAPL"],
                "chartData": [],
                "searchValue": "AAPL",
                "selectedPeriod": "1Y",
                "selectedMetrics": ["revenue"],
                "activeChart": "line"
            },
            "company": "AAPL",
            "period": "1Y",
            "metrics": ["revenue"],
            "chartType": "line",
            "chartData": []
        }
        
        print("Testing chatbot with file context...")
        response = requests.post(chat_url, json=payload, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Chat with context test PASSED")
        else:
            print("❌ Chat with context test FAILED")
            
    except Exception as e:
        print(f"❌ Chat with context test ERROR: {str(e)}")

def main():
    """Run all tests"""
    print("🧪 Testing File Upload and Chatbot Integration")
    print("=" * 50)
    
    if TEST_TOKEN == "your_test_token_here":
        print("⚠️  Please set a valid test token in the script")
        return
    
    test_file_upload()
    print()
    test_chat_with_context()
    
    print("\n" + "=" * 50)
    print("🏁 Testing complete!")

if __name__ == "__main__":
    main() 