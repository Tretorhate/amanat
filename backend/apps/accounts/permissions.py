from rest_framework import permissions


class IsDeputy(permissions.BasePermission):
    """
    Permission class to check if user is a deputy
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.user_type == 'deputy'


class IsCitizen(permissions.BasePermission):
    """
    Permission class to check if user is a citizen
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.user_type == 'citizen'


class IsAdmin(permissions.BasePermission):
    """
    Permission class to check if user is an admin
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff


class IsDeputyOrReadOnly(permissions.BasePermission):
    """
    Permission class: Deputies can edit, others can only read
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.user_type == 'deputy'


class IsOwnerOrDeputy(permissions.BasePermission):
    """
    Permission class: Owner or assigned deputy can access
    """
    def has_object_permission(self, request, view, obj):
        # Check if user is the citizen who created the appeal
        if hasattr(obj, 'citizen') and hasattr(request.user, 'citizen_profile'):
            if obj.citizen == request.user.citizen_profile:
                return True
        
        # Check if user is the assigned deputy
        if hasattr(obj, 'deputy') and hasattr(request.user, 'deputy_profile'):
            if obj.deputy == request.user.deputy_profile:
                return True
        
        # Admin can access everything
        if request.user.is_staff:
            return True
        
        return False
