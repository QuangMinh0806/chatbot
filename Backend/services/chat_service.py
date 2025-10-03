"""
Chat Service - Main entry point (Refactored)
Import các functions từ các service modules mới để backward compatibility
"""

# Import từ platform message service
from services.platform_message_service import (
    PlatformMessageService,
    send_fb,
    send_telegram, 
    send_zalo
)

# Import từ session service
from services.session_service import (
    SessionService,
    create_session_service,
    check_session_service
)

# Import từ message service
from services.message_service import (
    MessageService,
    send_message_service,
    send_message_fast_service,
    send_message_page_service,
    sendMessage,
    get_history_chat_service,
    get_all_history_chat_service,
    delete_message
)

# Import từ chat utils
from services.chat_utils import (
    ChatUtils,
    get_all_customer_service,
    update_chat_session,
    delete_chat_session,
    update_tag_chat_session
)

# Import legacy functions để backward compatibility
from config.redis_cache import cache_get, cache_set, cache_delete


def send_message_platform(data, platform: str, **kwargs):
    """Legacy function - sử dụng PlatformMessageService"""
    service = PlatformMessageService()
    return service.send_to_platform(platform, data=data, **kwargs)


def check_repply_cached(session_id: int, db):
    """Legacy function - sử dụng SessionService"""
    service = SessionService(db)
    return service.check_can_reply(session_id)


def check_repply(session_id: int, db):
    """Legacy function - sử dụng SessionService"""
    service = SessionService(db)
    return service.check_can_reply(session_id)


def clear_session_cache(session_id: int):
    """Legacy function - sử dụng SessionService"""
    session_cache_key = f"session:{session_id}"
    repply_cache_key = f"check_repply:{session_id}"
    cache_delete(session_cache_key)
    cache_delete(repply_cache_key)


def update_session_cache(session, ttl=300):
    """Legacy function - sử dụng SessionService"""
    service = SessionService(None)
    service.update_session_cache(session, ttl)


# Re-export tất cả functions để không break existing imports
__all__ = [
    # Platform functions
    'PlatformMessageService',
    'send_fb',
    'send_telegram', 
    'send_zalo',
    'send_message_platform',
    
    # Session functions
    'SessionService',
    'create_session_service',
    'check_session_service',
    'check_repply_cached',
    'check_repply',
    'clear_session_cache',
    'update_session_cache',
    
    # Message functions
    'MessageService',
    'send_message_service',
    'send_message_fast_service',
    'send_message_page_service',
    'sendMessage',
    'get_history_chat_service',
    'get_all_history_chat_service',
    'delete_message',
    
    # Utils functions
    'ChatUtils',
    'get_all_customer_service',
    'update_chat_session',
    'delete_chat_session',
    'update_tag_chat_session'
]