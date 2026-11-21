# __init__.py
# Magik Big Buttons - ComfyUI custom nodes
# Merged from comfyui-magik-knob and comfyui-magik-toggle

from .magik_knob import MagikKnobIntNode
from .magik_toggle import MagikToggleNode

# ComfyUI loads a package via either NODE_CLASS_MAPPINGS (V1) or
# comfy_entrypoint (V3), not both, so both nodes are registered as V1.
NODE_CLASS_MAPPINGS = {
    "MagikKnobIntNode": MagikKnobIntNode,
    "Magik.Toggle": MagikToggleNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "MagikKnobIntNode": "Magik Knob Int",
    "Magik.Toggle": "Magik Toggle",
}

# Serve the JavaScript / CSS assets from the 'js' subfolder
WEB_DIRECTORY = "js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
