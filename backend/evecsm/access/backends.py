from django.contrib.auth.backends import ModelBackend


class StatePermissionBackend(ModelBackend):
    """Normal Django permissions, plus everything granted by the user's state."""

    def get_group_permissions(self, user_obj, obj=None):
        perms = set(super().get_group_permissions(user_obj, obj))
        if user_obj.is_active and not user_obj.is_anonymous and obj is None and user_obj.state_id:
            cache_name = "_state_perm_cache"
            if not hasattr(user_obj, cache_name):
                rows = user_obj.state.permissions.values_list("content_type__app_label", "codename")
                setattr(user_obj, cache_name, {f"{app}.{code}" for app, code in rows})
            perms |= getattr(user_obj, cache_name)
        return perms
