from rest_framework.permissions import BasePermission


class IsStoreOwner(BasePermission):
    """Permission check for store owner."""
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user


class IsSuperAdmin(BasePermission):
    """Permission check for super admin."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_superuser or 
            getattr(request.user, 'role', '') == 'superadmin'
        )


class IsStoreStaff(BasePermission):
    """Allows access to staff members of the store (Stub for MVP)."""
    def has_permission(self, request, view):
        # Staff feature removed for MVP, only owner has access for now
        return False
