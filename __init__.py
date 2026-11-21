# __init__.py
# Magik Big Buttons - ComfyUI custom nodes
# Merged from comfyui-magik-knob and comfyui-magik-toggle

from .magik_big_integer import MagikBigIntegerNode
from .magik_toggle import MagikToggleNode

# ComfyUI loads a package via either NODE_CLASS_MAPPINGS (V1) or
# comfy_entrypoint (V3), not both, so both nodes are registered as V1.
NODE_CLASS_MAPPINGS = {
    "MagikBigIntegerNode": MagikBigIntegerNode,
    "Magik.Toggle": MagikToggleNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "MagikBigIntegerNode": "Magik Big Integer",
    "Magik.Toggle": "Magik Toggle",
}

# Serve the JavaScript / CSS assets from the 'js' subfolder
WEB_DIRECTORY = "js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
