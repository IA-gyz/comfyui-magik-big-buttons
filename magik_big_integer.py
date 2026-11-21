class MagikBigIntegerNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "bigIntegerValue": (  # <-- changed from "value" to "bigIntegerValue"
                    "INT",
                    {
                        "default": 1,
                        "min": 1,
                        "max": 999999,
                        "step": 1,
                        "widget": "magik_big_integer",
                    },
                ),
            }
        }

    RETURN_TYPES = ("INT",)
    RETURN_NAMES = (" ",)
    FUNCTION = "get_value"
    CATEGORY = "CRT/Utils/UI"

    def get_value(self, bigIntegerValue):  # <-- parameter name updated to match
        return (bigIntegerValue,)
