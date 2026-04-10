import logging
import time
from django.utils.deprecation import MiddlewareMixin
from django.urls import resolve


logger = logging.getLogger('request_logger')


class LoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log incoming requests and outgoing responses.
    """
    
    def process_request(self, request):
        request.start_time = time.time()
        
        # Log the incoming request
        logger.info(
            f"INCOMING REQUEST - "
            f"Method: {request.method}, "
            f"Path: {request.path}, "
            f"User: {getattr(request.user, 'email', 'Anonymous')}, "
            f"IP: {self.get_client_ip(request)}, "
            f"User-Agent: {request.META.get('HTTP_USER_AGENT', 'Unknown')}"
        )
        
        return None
    
    def process_response(self, request, response):
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
        else:
            duration = 0
        
        # Log the outgoing response
        logger.info(
            f"OUTGOING RESPONSE - "
            f"Path: {request.path}, "
            f"Status: {response.status_code}, "
            f"Duration: {duration:.3f}s, "
            f"User: {getattr(request.user, 'email', 'Anonymous')}"
        )
        
        return response
    
    def process_exception(self, request, exception):
        # Log any exceptions
        logger.error(
            f"REQUEST EXCEPTION - "
            f"Path: {request.path}, "
            f"Method: {request.method}, "
            f"User: {getattr(request.user, 'email', 'Anonymous')}, "
            f"Exception: {str(exception)}",
            exc_info=True
        )
        
        return None
    
    def get_client_ip(self, request):
        """
        Get the client IP address from the request.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class APILoggingMiddleware(LoggingMiddleware):
    """
    Specialized middleware for logging API requests specifically.
    """
    
    def process_request(self, request):
        # Only log API requests
        resolver_match = resolve(request.path_info)
        if resolver_match.app_name and 'api' in resolver_match.app_name.lower():
            return super().process_request(request)
        return None
    
    def process_response(self, request, response):
        # Only log API responses
        resolver_match = resolve(request.path_info)
        if resolver_match.app_name and 'api' in resolver_match.app_name.lower():
            return super().process_response(request, response)
        return response