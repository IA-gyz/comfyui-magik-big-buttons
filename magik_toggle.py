class MagikToggleNode:
    """
    A resizable boolean toggle node with customizable style and colors.
    The frontend replaces the default widget with a custom toggle UI.
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "value": ("BOOLEAN", {"default": False}),
            }
        }

    RETURN_TYPES = ("BOOLEAN",)
    RETURN_NAMES = (" ",)
    FUNCTION = "get_value"
    CATEGORY = "Magik/Widget"

    def get_value(self, value):
        return (value,)
