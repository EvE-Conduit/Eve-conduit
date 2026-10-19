from celery import Task as BaseTask
from celery.utils import uuid

from .state import active


class Task(BaseTask):
    """Every background job: a demo request starts none (the demo has nothing to sync, and the workers use the
    real database). The caller gets a result that never comes, as if the job were still queued."""

    def apply_async(self, *args, **kwargs):
        if active():
            return self.AsyncResult(uuid())
        return super().apply_async(*args, **kwargs)
