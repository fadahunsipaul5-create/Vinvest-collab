import json
import math
import numpy as np
from rest_framework.renderers import JSONRenderer

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer, np.int_)):
            return int(obj)
        if isinstance(obj, (np.floating, np.float_)):
            # Replace NaN/inf with None (which becomes null in JSON)
            if not math.isfinite(obj):
                return None
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(CustomJSONEncoder, self).default(obj)

class CustomJSONRenderer(JSONRenderer):
    encoder_class = CustomJSONEncoder
