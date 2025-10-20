"""
Helper functions để gửi tin nhắn qua các nền tảng social media:
- Facebook Messenger
- Telegram
- Zalo
"""

import asyncio
import base64
import io
import json
import requests
import traceback
from sqlalchemy import select
from models.facebook_page import FacebookPage
from models.telegram_page import TelegramBot
from models.zalo import ZaloBot
from config.database import AsyncSessionLocal


def convert_file_to_facebook_attachment_id(file_data, access_token):
    """
    Chuyển đổi file/URL/base64 thành Facebook attachment_id
    
    Args:
        file_data: URL, base64 string, hoặc file object
        access_token: Facebook page access token
        
    Returns:
        str: attachment_id nếu thành công, None nếu thất bại
    """
    try:
        print(f"🔍 Đang xử lý file_data type: {type(file_data)}, value preview: {str(file_data)[:100] if isinstance(file_data, str) else 'Not string'}")
        
        # Xử lý nếu là string
        if isinstance(file_data, str):
            # Kiểm tra nếu là URL (http/https)
            if file_data.startswith('http://') or file_data.startswith('https://'):
                print(f"📷 Phát hiện URL ảnh: {file_data}")
                # Nếu là URL, tải ảnh về và upload lên Facebook
                try:
                    img_response = requests.get(file_data, timeout=10)
                    if img_response.status_code == 200:
                        image_bytes = img_response.content
                        # Lấy loại ảnh từ URL hoặc content-type
                        content_type = img_response.headers.get('content-type', 'image/jpeg')
                        image_type = content_type.split('/')[-1].split(';')[0]
                        
                        image_file = io.BytesIO(image_bytes)
                        image_file.name = f"image.{image_type}"
                    else:
                        print(f"❌ Không thể tải ảnh từ URL: {img_response.status_code}")
                        return None
                except Exception as url_error:
                    print(f"❌ Lỗi khi tải ảnh từ URL: {url_error}")
                    return None
            else:
                # Xử lý base64 string
                print(f"🔐 Phát hiện base64 string")
                try:
                    # Loại bỏ prefix "data:image/...;base64," nếu có
                    if ',' in file_data and file_data.startswith('data:'):
                        header, encoded = file_data.split(',', 1)
                        # Lấy loại ảnh từ header (png, jpg, jpeg, etc.)
                        image_type = header.split('/')[1].split(';')[0]
                    else:
                        encoded = file_data
                        image_type = 'png'
                    
                    # Decode base64 thành bytes
                    image_bytes = base64.b64decode(encoded)
                    
                    # Tạo file-like object từ bytes
                    image_file = io.BytesIO(image_bytes)
                    image_file.name = f"image.{image_type}"
                except Exception as b64_error:
                    print(f"❌ Lỗi decode base64: {b64_error}")
                    return None
        else:
            # Nếu đã là file object
            print(f"📁 Phát hiện file object")
            image_file = file_data
            image_type = 'jpeg'
        
        # Upload lên Facebook để lấy attachment_id
        url = f"https://graph.facebook.com/v23.0/me/message_attachments"
        
        params = {
            'access_token': access_token
        }
        
        payload = {
            'message': json.dumps({
                'attachment': {
                    'type': 'image',
                    'payload': {
                        'is_reusable': True
                    }
                }
            })
        }
        
        # Reset file pointer về đầu
        if hasattr(image_file, 'seek'):
            image_file.seek(0)
        
        files = {
            'filedata': (getattr(image_file, 'name', 'image.jpg'), image_file, f'image/{image_type}')
        }
        
        print(f"📤 Đang upload ảnh lên Facebook...")
        response = requests.post(url, params=params, data=payload, files=files)
        
        if response.status_code == 200:
            result = response.json()
            attachment_id = result.get('attachment_id')
            if attachment_id:
                print(f"✅ Successfully uploaded image to Facebook, attachment_id: {attachment_id}")
                return attachment_id
            else:
                print(f"❌ No attachment_id in response: {result}")
                return None
        else:
            print(f"❌ Failed to upload image to Facebook: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Exception khi convert file to Facebook attachment_id: {e}")
        traceback.print_exc()
        return None


async def send_fb(page_id: str, sender_id, data, images=None, db=None):
    """
    Gửi tin nhắn qua Facebook Messenger - BẤT ĐỒNG BỘ (async)
    ✅ Sử dụng AsyncSession
    
    Args:
        page_id: ID của Facebook Page
        sender_id: ID của người nhận
        data: Dữ liệu tin nhắn (có thể là dict hoặc Message object)
        images: List các đường dẫn file ảnh (URL hoặc base64) - tham số tùy chọn
        db: AsyncSession (có thể None, sẽ tự tạo AsyncSessionLocal)
    """
    if db is None:
        db = AsyncSessionLocal()
        should_close = True
    else:
        should_close = False
    
    try:
        # Async query
        result = await db.execute(select(FacebookPage).filter(FacebookPage.page_id == page_id))
        page = result.scalar_one_or_none()
        if not page:
            return
           
        PAGE_ACCESS_TOKEN = page.access_token
        url_text = f"https://graph.facebook.com/v23.0/{page_id}/messages?access_token={PAGE_ACCESS_TOKEN}"
        url_image = f"https://graph.facebook.com/v23.0/me/messages?access_token={PAGE_ACCESS_TOKEN}"
        
        # Ưu tiên sử dụng tham số images nếu được truyền vào
        images_data = None
        if images is not None:
            images_data = images
            print(f"📸 Sử dụng images từ tham số: {type(images_data)}")
        elif hasattr(data, 'image'):
            images_data = data.image
            print(f"📸 Sử dụng images từ data.image")
        elif isinstance(data, dict) and 'image' in data:
            images_data = data['image']
            print(f"📸 Sử dụng images từ data['image']")
           
        if images_data:
            try:
                if isinstance(images_data, str):
                    images = json.loads(images_data)
                elif isinstance(images_data, list):
                    images = images_data
                else:
                    images = images_data
               
                if images and len(images) > 0:
                    print(f"📤 Đang xử lý {len(images)} ảnh để gửi qua Facebook")
                    
                    # Chuyển đổi mỗi file/base64 thành attachment_id
                    for image_data in images:
                        attachment_id = convert_file_to_facebook_attachment_id(image_data, PAGE_ACCESS_TOKEN)
                        
                        if attachment_id:
                            # Gửi tin nhắn với attachment_id
                            image_payload = {
                                "recipient": {
                                    "id": sender_id
                                },
                                "message": {
                                    "attachment": {
                                        "type": "image",
                                        "payload": {
                                            "attachment_id": attachment_id
                                        }
                                    }
                                }
                            }
                            
                            print(f"📋 Image payload for Facebook: {json.dumps(image_payload, indent=2)}")
                            
                            try:
                                response = requests.post(url_image, json=image_payload)
                                print(f"📊 Images response: {response.status_code}")
                                print(f"📄 Response body: {response.text}")
                               
                                if response.status_code == 200:
                                    response_data = response.json()
                                    print(f"✅ Successfully sent image with attachment_id: {attachment_id}")
                                    print(f"📬 Message ID: {response_data.get('message_id', 'N/A')}")
                                else:
                                    print(f"❌ Failed to send image: {response.text}")
                            except requests.exceptions.RequestException as req_error:
                                print(f"🌐 Network error sending image: {req_error}")
                            except Exception as send_error:
                                print(f"❌ Unexpected error sending image: {send_error}")
                        else:
                            print(f"❌ Failed to get attachment_id for image")
                else:
                    print("⚠️ No images found in data")
            except Exception as img_error:
                print(f"❌ Error processing images for Facebook: {img_error}")
                traceback.print_exc()
        else:
            print("ℹ️ No images to send")
       
        # Kiểm tra content - hỗ trợ cả Message object và dictionary
        content_data = None
        if hasattr(data, 'content'):
            content_data = data.content
        elif isinstance(data, dict) and 'content' in data:
            content_data = data['content']
           
        # Gửi tin nhắn text
        if content_data:
            print(f"💬 Sending text message: {content_data}")
            text_payload = {
                "recipient": {
                    "id": sender_id
                },
                "message": {
                    "text": content_data
                }
            }
           
            print(f"📋 Text payload for Facebook: {json.dumps(text_payload, indent=2)}")
           
            try:
                response = requests.post(url_text, json=text_payload, timeout=15)
                print(f"📊 Text message response: {response.status_code}")
                print(f"📄 Response body: {response.text}")
               
                if response.status_code == 200:
                    print("✅ Successfully sent text message")
                else:
                    print(f"❌ Failed to send text: {response.text}")
            except Exception as text_error:
                print(f"❌ Error sending text message: {text_error}")
        else:
            print("ℹ️ No text content to send")
           
    except Exception as e:
        print(f"❌ Error in send_fb: {e}")
        traceback.print_exc()
    finally:
        if should_close:
            await db.close()


async def send_telegram(chat_id, message, db=None):
    """
    Gửi tin nhắn qua Telegram - BẤT ĐỒNG BỘ (async)
    ✅ Sử dụng AsyncSession
    
    Args:
        chat_id: ID của chat/user Telegram
        message: Dữ liệu tin nhắn (có thể là dict hoặc Message object)
        db: AsyncSession (có thể None, sẽ tự tạo AsyncSessionLocal)
    """
    if db is None:
        db = AsyncSessionLocal()
        should_close = True
    else:
        should_close = False
    try:
        result = await db.execute(select(TelegramBot).filter(TelegramBot.id == 1))
        token = result.scalar_one_or_none()
        
        TELEGRAM_TOKEN = token.bot_token
        
        # Kiểm tra nếu có ảnh - hỗ trợ cả Message object và dictionary
        images_data = None
        if hasattr(message, 'image'):
            images_data = message.image
        elif isinstance(message, dict) and 'image' in message:
            images_data = message['image']
            
        if images_data:
            try:
                # Xử lý dữ liệu ảnh - có thể là string JSON hoặc list
                if isinstance(images_data, str):
                    # Nếu là string JSON từ database
                    images = json.loads(images_data)
                elif isinstance(images_data, list):
                    # Nếu là list từ response_messages
                    images = images_data
                else:
                    images = images_data
                    
                if images and len(images) > 0:
                    # Gửi từng ảnh
                    for image_url in images:
                        photo_url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendPhoto"
                        photo_payload = {
                            "chat_id": chat_id,
                            "photo": image_url
                        }
                        requests.post(photo_url, json=photo_payload)
            except Exception as img_error:
                print(f"Error sending image: {img_error}")
        
        # Kiểm tra content - hỗ trợ cả Message object và dictionary
        content_data = None
        if hasattr(message, 'content'):
            content_data = message.content
        elif isinstance(message, dict) and 'content' in message:
            content_data = message['content']
            
        # Gửi tin nhắn text
        if content_data:
            text_url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
            payload = {
                "chat_id": chat_id,
                "text": content_data
            }
            requests.post(text_url, json=payload)
            
    except Exception as e:
        print(e)
        traceback.print_exc()
    finally: 
        if should_close:
            await db.close()


def convert_base64_to_attachment_id(base64_string, token):
    """
    Chuyển đổi base64 image string thành attachment_id của Zalo
    
    Args:
        base64_string: Base64 encoded image string từ FE (format: "data:image/png;base64,...")
        token: Zalo access token
        
    Returns:
        str: attachment_id nếu thành công, None nếu thất bại
    """
    try:
        # Loại bỏ prefix "data:image/...;base64," nếu có
        if ',' in base64_string:
            header, encoded = base64_string.split(',', 1)
            # Extract image type từ header (vd: "data:image/png;base64" -> "png")
            image_type = header.split('/')[1].split(';')[0] if '/' in header else 'png'
        else:
            encoded = base64_string
            image_type = 'png'
        
        # Decode base64 thành bytes
        image_bytes = base64.b64decode(encoded)
        
        # Tạo file-like object từ bytes
        image_file = io.BytesIO(image_bytes)
        image_file.name = f"image.{image_type}"
        
        # Upload lên Zalo
        url = "https://openapi.zalo.me/v2.0/oa/upload/image"
        headers = {
            "access_token": token
        }
        
        files = {
            'file': (image_file.name, image_file, f'image/{image_type}')
        }
        
        response = requests.post(url, headers=headers, files=files)
        
        if response.status_code == 200:
            data = response.json()
            attachment_id = data.get("data", {}).get("attachment_id")
            if attachment_id:
                print(f"✅ Đã chuyển đổi base64 thành attachment_id: {attachment_id}")
                return attachment_id
            else:
                print(f"❌ Không tìm thấy attachment_id trong response: {data}")
                return None
        else:
            print(f"❌ Lỗi upload ảnh lên Zalo: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Exception khi convert base64 to attachment_id: {e}")
        traceback.print_exc()
        return None


def send_text_only(url, headers, chat_id, content_text):
    """
    Helper function để gửi tin nhắn text thuần qua Zalo
    
    Args:
        url: Zalo API endpoint
        headers: Request headers với access_token
        chat_id: ID của người nhận
        content_text: Nội dung text cần gửi
    """
    payload = {
        "recipient": {
            "user_id": chat_id
        },
        "message": {
            "text": content_text
        }
    }
    
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    
    if response.status_code == 200:
        print(f"✅ Đã gửi tin nhắn text đến Zalo: {chat_id}")
    else:
        print(f"❌ Lỗi gửi tin nhắn text: {response.status_code} - {response.text}")


async def send_zalo(chat_id, message, images_base64, db=None):
    """
    Gửi tin nhắn qua Zalo - BẤT ĐỒNG BỘ (async)
    ✅ Sử dụng AsyncSession
    
    Args:
        chat_id: ID của người nhận trên Zalo
        message: Dữ liệu tin nhắn (có thể là dict hoặc Message object)
        images_base64: List các ảnh dạng base64
        db: AsyncSession (có thể None, sẽ tự tạo AsyncSessionLocal)
    """
    if db is None:
        db = AsyncSessionLocal()
        should_close = True
    else:
        should_close = False
    
    try:
        # Lấy thông tin Zalo bot - Async query
        result = await db.execute(select(ZaloBot).filter(ZaloBot.id == 1))
        zalo = result.scalar_one_or_none()
        if not zalo:
            print("❌ Không tìm thấy Zalo bot configuration")
            return
            
        ACCESS_TOKEN = zalo.access_token
        
        # Lấy nội dung tin nhắn (text luôn có)
        content_text = ""
        if hasattr(message, 'content'):
            content_text = message.content
        elif isinstance(message, dict) and 'content' in message:
            content_text = message['content']
        
        if not content_text:
            print("⚠️ Tin nhắn không có nội dung text")
            return
        
        url = "https://openapi.zalo.me/v3.0/oa/message/cs"
        headers = {
            "Content-Type": "application/json",
            "access_token": ACCESS_TOKEN
        }
        
        # Nếu có ảnh, gửi ảnh kèm text
        if images_base64 and len(images_base64) > 0:
            # Lấy ảnh đầu tiên (Zalo chỉ hỗ trợ 1 ảnh/tin nhắn)
            first_image = images_base64[0] if isinstance(images_base64, list) else images_base64
            
            print(f"🔄 Đang chuyển đổi base64 thành attachment_id...")
            attachment_id = convert_base64_to_attachment_id(first_image, ACCESS_TOKEN)
            
            if attachment_id:
                # Gửi tin nhắn có ảnh + text
                payload = {
                    "recipient": {
                        "user_id": chat_id
                    },
                    "message": {
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "template_type": "media",
                                "elements": [
                                    {
                                        "media_type": "image",
                                        "attachment_id": attachment_id
                                    }
                                ]
                            }
                        },
                        "text": content_text
                    }
                }
                
                response = requests.post(url, headers=headers, data=json.dumps(payload))
                
                if response.status_code == 200:
                    print(f"✅ Đã gửi tin nhắn có ảnh đến Zalo: {chat_id}")
                else:
                    send_text_only(url, headers, chat_id, content_text)
            else:
                send_text_only(url, headers, chat_id, content_text)
        else:
            # Không có ảnh, gửi chỉ text
            send_text_only(url, headers, chat_id, content_text)
    
    except Exception as e:
        print(f"❌ Exception trong send_zalo: {e}")
        traceback.print_exc()
    finally:
        if should_close:
            await db.close()
