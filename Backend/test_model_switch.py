#!/usr/bin/env python3
"""
Test script để kiểm tra việc switch giữa GPT và Gemini
"""
import sys
import os

# Add the Backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from config.database import SessionLocal
from models.llm import LLM
from llm.llm import RAGModel as Gemini_RAGModel
from llm.gpt import RAGModel as GPT_RAGModel

def test_model_switching():
    """Test switching between GPT and Gemini"""
    print("🔬 Testing LLM Model Switching...")
    
    db = SessionLocal()
    
    try:
        # Get current LLM config
        llm_config = db.query(LLM).filter(LLM.id == 1).first()
        if not llm_config:
            print("❌ No LLM config found in database")
            return
        
        print(f"📋 Current LLM: {llm_config.name}")
        print(f"🔑 Current Key: {llm_config.key[:10]}...")
        
        # Test based on current model
        if llm_config.name == "gemini":
            print("\n🧪 Testing Gemini Model...")
            rag = Gemini_RAGModel(db_session=db)
            
            # Test a simple call
            try:
                response = rag.build_search_key(1, "Xin chào")
                print(f"✅ Gemini Response: {response[:50]}...")
            except Exception as e:
                print(f"❌ Gemini Error: {e}")
                
        else:  # GPT
            print("\n🧪 Testing GPT Model...")
            rag = GPT_RAGModel(db_session=db)
            
            # Test a simple call
            try:
                response = rag.build_search_key(1, "Xin chào")
                print(f"✅ GPT Response: {response[:50]}...")
            except Exception as e:
                print(f"❌ GPT Error: {e}")
        
        print("\n✨ Test completed!")
        
    except Exception as e:
        print(f"❌ Test Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_model_switching()