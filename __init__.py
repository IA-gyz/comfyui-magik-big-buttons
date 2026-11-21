# __init__.py
# Magik Big Buttons - ComfyUI custom nodes
# Merged from comfyui-magik-knob and comfyui-magik-toggle

from typing_extensions import override
from comfy_api.latest import ComfyExtension, io

from .magik_knob import MagikKnobIntNode
from .magik_toggle import MagikToggleNode

NODE_CLASS_MAPPINGS = {
    "MagikKnobIntNode": MagikKnobIntNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "MagikKnobIntNode": "Magik Knob Int",
}


class MagikBigButtonsExtension(ComfyExtension):
    @override
    async def get_node_list(self) -> list[type[io.ComfyNode]]:
        return [MagikToggleNode]


async def comfy_entrypoint() -> MagikBigButtonsExtension:
    return MagikBigButtonsExtension()


# Serve the JavaScript / CSS assets from the 'js' subfolder
WEB_DIRECTORY = "js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY", "comfy_entrypoint"]
