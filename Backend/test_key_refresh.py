#!/usr/bin/env python3
"""
Test script để kiểm tra việc refresh key khi thay đổi
"""
import sys
import os
import time

# Add the Backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from config.database import SessionLocal
from models.llm import LLM
from llm.llm import RAGModel as Gemini_RAGModel
from llm.gpt import RAGModel as GPT_RAGModel

def test_key_refresh():
    """Test key refresh mechanism"""
    print("🔬 Testing LLM Key Refresh Mechanism...")
    
    db = SessionLocal()
    
    try:
        # Get current LLM config
        llm_config = db.query(LLM).filter(LLM.id == 1).first()
        if not llm_config:
            print("❌ No LLM config found in database")
            return
        
        print(f"📋 Current LLM: {llm_config.name}")
        original_key = llm_config.key
        print(f"🔑 Original Key: {original_key[:10]}...")
        
        # Create model instance
        if llm_config.name == "gemini":
            rag = Gemini_RAGModel(db_session=db)
            print("🧪 Created Gemini Model")
        else:
            rag = GPT_RAGModel(db_session=db)
            print("🧪 Created GPT Model")
        
        # Test call 1
        print("\n🔥 Test call 1 with original key...")
        try:
            response1 = rag.build_search_key(1, "Test 1")
            print(f"✅ Response 1: {response1[:30]}...")
        except Exception as e:
            print(f"❌ Error 1: {e}")
        
        # Simulate key change in database
        test_key = original_key + "_UPDATED"
        print(f"\n🔄 Simulating key change to: {test_key[:10]}...")
        llm_config.key = test_key
        db.commit()
        
        # Wait a bit to ensure timestamp difference
        time.sleep(1)
        
        # Test call 2 - should detect key change
        print("\n🔥 Test call 2 with updated key...")
        try:
            response2 = rag.build_search_key(1, "Test 2")
            print(f"✅ Response 2: {response2[:30]}...")
        except Exception as e:
            print(f"❌ Error 2: {e}")
        
        # Restore original key
        print(f"\n🔄 Restoring original key: {original_key[:10]}...")
        llm_config.key = original_key
        db.commit()
        
        print("\n✨ Key refresh test completed!")
        
    except Exception as e:
        print(f"❌ Test Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_key_refresh()