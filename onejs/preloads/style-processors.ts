import { ImageLoader, UIStyleUtil, FontLoader } from "OneJS/Utils"
import { parseColor } from "onejs/utils/color-parser"
import { parseFloat2, parseFloat3 } from "onejs/utils/float-parser"
import { Style } from "preact/jsx"
import { List } from "System/Collections/Generic"
import { FontStyle, ScaleMode, TextAnchor } from "UnityEngine"
import { Align, DisplayStyle, FlexDirection, Wrap, Justify, Position, TextOverflow, TimeValue, StylePropertyName, EasingFunction, OverflowClipBox, TextOverflowPosition, Visibility, WhiteSpace, StyleKeyword, StyleColor, StyleBackground, Background, Length, LengthUnit, StyleLength, StyleFloat, StyleInt, Cursor, StyleCursor, StyleRotate, Rotate, Angle, StyleScale, Scale, TextShadow, StyleTextShadow, StyleTransformOrigin, TransformOrigin, StyleTranslate, Translate, StyleFont, StyleFontDefinition, IStyle, Overflow, EasingMode, FontDefinition } from "UnityEngine/UIElements"

/**
 * Unity Specific Style processors
 */
type Processors = { [p in keyof Style]-?: (style, value: Style[p]) => void }
let styleProcessors: Processors = {} as any

setStyleEnum("alignContent", Align)
setStyleEnum("alignItems", Align)
setStyleEnum("alignSelf", Align)
setStyleColor("backgroundColor")
setStyleBackground("backgroundImage")

setStyleBorderColor("borderColor")
setStyleBorderWidth("borderWidth")
setStyleBorderRadius("borderRadius")
setStyleColor("borderBottomColor")
setStyleLength("borderBottomLeftRadius")
setStyleLength("borderBottomRightRadius")
setStyleFloat("borderBottomWidth")
setStyleColor("borderLeftColor")
setStyleFloat("borderLeftWidth")
setStyleColor("borderRightColor")
setStyleFloat("borderRightWidth")
setStyleColor("borderTopColor")
setStyleLength("borderTopLeftRadius")
setStyleLength("borderTopRightRadius")
setStyleFloat("borderTopWidth")

setStyleLength("bottom")
setStyleColor("color")
setStyleCursor("cursor")
setStyleEnum("display", DisplayStyle)
setStyleLength("flexBasis")
setStyleEnum("flexDirection", FlexDirection)
setStyleFloat("flexGrow")
setStyleFloat("flexShrink")
setStyleEnum("flexWrap", Wrap)
setStyleLength("fontSize")
setStyleLength("height")

setStyleEnum("justifyContent", Justify)
setStyleLength("left")
setStyleLength("letterSpacing")
setStyleMargin("margin")
setStyleLength("marginBottom")
setStyleLength("marginLeft")
setStyleLength("marginRight")
setStyleLength("marginTop")
setStyleLength("maxHeight")
setStyleLength("maxWidth")
setStyleLength("minHeight")
setStyleLength("minWidth")
setStyleFloat("opacity")
setStyleEnum("overflow", Overflow)
setStylePadding("padding")
setStyleLength("paddingBottom")
setStyleLength("paddingLeft")
setStyleLength("paddingRight")
setStyleLength("paddingTop")
setStyleEnum("position", Position)
setStyleLength("right")
setStyleRotate("rotate")
setStyleScale("scale")
setStyleEnum("textOverflow", TextOverflow)
setStyleTextShadow("textShadow")

setStyleLength("top")
setStyleTransformOrigin("transformOrigin")
setStyleListTimeValue("transitionDelay", TimeValue)
setStyleListTimeValue("transitionDuration", TimeValue)
setStyleListPropertyName("transitionProperty", StylePropertyName)
setStyleListEasingFunction("transitionTimingFunction", EasingFunction)
setStyleTranslate("translate")
setStyleColor("unityBackgroundImageTintColor")
setStyleEnum("unityBackgroundScaleMode", ScaleMode)

setStyleFont("unityFont")
setStyleFontDefinition("unityFontDefinition")
setStyleEnum("unityFontStyleAndWeight", FontStyle)
setStyleEnum("unityOverflowClipBox", OverflowClipBox)
setStyleLength("unityParagraphSpacing")
setStyleInt("unitySliceBottom")
setStyleInt("unitySliceLeft")
setStyleInt("unitySliceRight")
setStyleInt("unitySliceTop")

setStyleEnum("unityTextAlign", TextAnchor)
setStyleColor("unityTextOutlineColor")
setStyleFloat("unityTextOutlineWidth")
setStyleEnum("unityTextOverflowPosition", TextOverflowPosition)
setStyleEnum("visibility", Visibility)
setStyleEnum("whiteSpace", WhiteSpace)
setStyleLength("width")
setStyleLength("wordSpacing")

function setStyleEnum(propertyName: keyof Style, enumType) {
    styleProcessors[propertyName] = (style, value) => {
        let styleEnumNull = (document as any).createStyleEnumWithKeyword(StyleKeyword.Initial, getType(enumType))
        let styleEnum = (document as any).createStyleEnum(enumType[value], getType(enumType))
        style[propertyName] = value == null ? styleEnumNull : styleEnum
    }
}

function setStyleColor(propertyName: keyof Style) {
    styleProcessors[propertyName] = (style, value) => {
        style[propertyName] = value == null ? new StyleColor(StyleKeyword.Initial) : new StyleColor(parseColor(value))
    }
}

function setStyleBackground(propertyName: keyof Style) {
    styleProcessors[propertyName] = (style, value) => {
        style[propertyName] = value == null ? new StyleBackground(StyleKeyword.Initial) : new StyleBackground(Background.FromTexture2D(typeof value == "string" ? ImageLoader.Load(value) : value))
    }
}

function setStyleLength(propertyName: keyof Style) {
    styleProcessors[propertyName] = (style, value) => {
        let v: Length
        if (typeof value === "string") {
            if (value.endsWith("%")) {
                let n = parseFloat(value.replace("%", ""))
                if (!isNaN(n))
                    v = new Length(n, LengthUnit.Percent)
            } else {
                let n = parseFloat(value.endsWith("px") ? value.replace("px", "") : value)
                if (!isNaN(n))
                    v = new Length(n, LengthUnit.Pixel)
            }

        } else if (typeof value === "number") {
            v = new Length(value)
        }
        style[propertyName] = value == null || typeof v === "undefined" ? new StyleLength(StyleKeyword.Initial) : new StyleLength(v)
    }
}

function setStyleFloat(propertyName: keyof Style) {
    styleProcessors[propertyName] = (style, value) => {
        style[propertyName] = value == null ? new StyleFloat(StyleKeyword.Initial) : UIStyleUtil.GetStyleFloat(value)
    }
}

function setStyleInt(propertyName: keyof Style) {
    styleProcessors[propertyName] = (style, value) => {
        style[propertyName] = value == null ? new StyleInt(StyleKeyword.Initial) : UIStyleUtil.GetStyleInt(value)
    }
}

function setStyleCursor(propertyName: keyof Style) {
    styleProcessors[propertyName] = (style, value) => {
        let cursor = new Cursor()
        cursor.texture = value.texture
        cursor.hotspot = value.hotspot
        style[propertyName] = value == null ? new StyleCursor(StyleKeyword.Initial) : new StyleCursor(new Cursor())
    }
}

function setStyleRotate(propertyName: keyof Style) {
    styleProcessors[propertyName] = (style, value) => {
        style[propertyName] = value == null ? new StyleRotate(StyleKeyword.Initial) : new StyleRotate(new Rotate(new Angle(value)))
    }
}

function setStyleScale(propertyName: keyof Style) {
    styleProcessors[propertyName] = (style, value) => {
        var v = parseFloat2(value)
        style[propertyName] = value == null ? new StyleScale(StyleKeyword.Initial) : new StyleScale(new Scale(v))
    }
}

function setStyleTextShadow(propertyName: keyof Style) {
    styleProcessors[propertyName] = (style, value) => {
        let ts = new TextShadow()
        ts.offset = parseFloat2(value.offset)
        ts.blurRadius = value.blurRadius
        ts.color = parseColor(value.color)
        style[propertyName] = value == null ? new StyleTextShadow(StyleKeyword.Initial) : new StyleTextShadow(ts)
    }
}

function setStyleTransformOrigin(propertyName: keyof Style) {
    styleProcessors[propertyName] = (style, value) => {
        let v = parseFloat3(value)
        style[propertyName] = value == null ? new StyleTransformOrigin(StyleKeyword.Initial) : new StyleTransformOrigin(new TransformOrigin(new Length(v.x), new Length(v.y), v.z))
    }
}

function setStyleListTimeValue(propertyName: keyof Style, valueType) {
    styleProcessors[propertyName] = (style, value) => {
        let UnityEngine = importNamespace("UnityEngine")
        let listType = System.Collections.Generic.List(UnityEngine.UIElements.TimeValue)
        let list = new listType()
        for (let i = 0; i < value.length; i++)
            list.Add(new TimeValue(value[i]));

        let styleListNull = (document as any).createStyleListWithKeyword(StyleKeyword.Initial, getType(valueType))
        let styleList = (document as any).createStyleList(list, getType(valueType))
        style[propertyName] = value == null ? styleListNull : styleList
    }
}

function setStyleListPropertyName(propertyName: keyof Style, valueType) {
    styleProcessors[propertyName] = (style, value) => {
        let UnityEngine = importNamespace("UnityEngine")
        let listType = System.Collections.Generic.List(UnityEngine.UIElements.StylePropertyName)
        let list = new listType()
        for (let i = 0; i < value.length; i++)
            list.Add(new StylePropertyName(value[i]));

        let styleListNull = (document as any).createStyleListWithKeyword(StyleKeyword.Initial, getType(valueType))
        let styleList = (document as any).createStyleList(list, getType(valueType))
        style[propertyName] = value == null ? styleListNull : styleList
    }
}

function setStyleListEasingFunction(propertyName: keyof Style, valueType) {
    styleProcessors[propertyName] = (style, value) => {
        let UnityEngine = importNamespace("UnityEngine")
        let listType = System.Collections.Generic.List(UnityEngine.UIElements.EasingFunction)
        let list = new listType()
        for (let i = 0; i < value.length; i++)
            list.Add(new EasingFunction(EasingMode[value[i] as string]));

        let styleListNull = (document as any).createStyleListWithKeyword(StyleKeyword.Initial, getType(valueType))
        let styleList = (document as any).createStyleList(list, getType(valueType))
        style[propertyName] = value == null ? styleListNull : styleList
    }
}

function setStyleTranslate(propertyName: keyof Style) {
    styleProcessors[propertyName] = (style, value) => {
        var v = parseFloat3(value)
        style[propertyName] = value == null ? new StyleTranslate(StyleKeyword.Initial) : new StyleTranslate(new Translate(new Length(v.x), new Length(v.y), v.z))
    }
}

function setStyleFont(propertyName: keyof Style) {
    styleProcessors[propertyName] = (style, value) => {
        style[propertyName] = value == null ? new StyleFont(StyleKeyword.Initial) : new StyleFont(typeof value == "string" ? FontLoader.Load(value) : value)
    }
}

function setStyleFontDefinition(propertyName: keyof Style) {
    styleProcessors[propertyName] = (style, value) => {
        style[propertyName] = value == null ? new StyleFontDefinition(StyleKeyword.Initial) : new StyleFontDefinition(typeof value == "string" ? FontLoader.Load(value) : value)
    }
}

function setStyleBorderColor(propertyName: keyof Style) {
    styleProcessors[propertyName] = (style: IStyle, value) => {
        style.borderTopColor = value == null ? new StyleColor(StyleKeyword.Initial) : new StyleColor(parseColor(value))
        style.borderRightColor = value == null ? new StyleColor(StyleKeyword.Initial) : new StyleColor(parseColor(value))
        style.borderBottomColor = value == null ? new StyleColor(StyleKeyword.Initial) : new StyleColor(parseColor(value))
        style.borderLeftColor = value == null ? new StyleColor(StyleKeyword.Initial) : new StyleColor(parseColor(value))
    }
}

function setStyleBorderWidth(propertyName: keyof Style) {
    styleProcessors[propertyName] = (style: IStyle, value) => {
        let vals = [0, 0, 0, 0]
        if (Array.isArray(value)) {
            vals = [parseFloat(value[0]) ?? 0, parseFloat(value[1]) ?? 0, parseFloat(value[2]) ?? 0, parseFloat(value[3]) ?? 0]
        } else if (typeof value === "number") {
            vals[0] = vals[1] = vals[2] = vals[3] = value
        }
        style.borderTopWidth = value == null ? new StyleFloat(StyleKeyword.Initial) : UIStyleUtil.GetStyleFloat(vals[0])
        style.borderRightWidth = value == null ? new StyleFloat(StyleKeyword.Initial) : UIStyleUtil.GetStyleFloat(vals[1])
        style.borderBottomWidth = value == null ? new StyleFloat(StyleKeyword.Initial) : UIStyleUtil.GetStyleFloat(vals[2])
        style.borderLeftWidth = value == null ? new StyleFloat(StyleKeyword.Initial) : UIStyleUtil.GetStyleFloat(vals[3])
    }
}

function setStyleBorderRadius(propertyName: keyof Style) {
    styleProcessors[propertyName] = (style: IStyle, value) => {
        let vals = [0, 0, 0, 0]
        if (Array.isArray(value)) {
            vals = [parseFloat(value[0]) ?? 0, parseFloat(value[1]) ?? 0, parseFloat(value[2]) ?? 0, parseFloat(value[3]) ?? 0]
        } else if (typeof value === "number") {
            vals[0] = vals[1] = vals[2] = vals[3] = value
        }
        style.borderTopLeftRadius = value == null ? new StyleLength(StyleKeyword.Initial) : new StyleLength(new Length(vals[0]))
        style.borderTopRightRadius = value == null ? new StyleLength(StyleKeyword.Initial) : new StyleLength(new Length(vals[1]))
        style.borderBottomRightRadius = value == null ? new StyleLength(StyleKeyword.Initial) : new StyleLength(new Length(vals[2]))
        style.borderBottomLeftRadius = value == null ? new StyleLength(StyleKeyword.Initial) : new StyleLength(new Length(vals[3]))
    }
}

function setStyleMargin(propertyName: keyof Style) {
    styleProcessors[propertyName] = (style: IStyle, value) => {
        let vals = [0, 0, 0, 0]
        if (Array.isArray(value)) {
            vals = [parseFloat(value[0]) ?? 0, parseFloat(value[1]) ?? 0, parseFloat(value[2]) ?? 0, parseFloat(value[3]) ?? 0]
        } else if (typeof value === "number") {
            vals[0] = vals[1] = vals[2] = vals[3] = value
        }
        style.marginTop = value == null ? new StyleLength(StyleKeyword.Initial) : new StyleLength(new Length(vals[0]))
        style.marginRight = value == null ? new StyleLength(StyleKeyword.Initial) : new StyleLength(new Length(vals[1]))
        style.marginBottom = value == null ? new StyleLength(StyleKeyword.Initial) : new StyleLength(new Length(vals[2]))
        style.marginLeft = value == null ? new StyleLength(StyleKeyword.Initial) : new StyleLength(new Length(vals[3]))
    }
}

function setStylePadding(propertyName: keyof Style) {
    styleProcessors[propertyName] = (style: IStyle, value) => {
        let vals = [0, 0, 0, 0]
        if (Array.isArray(value)) {
            vals = [parseFloat(value[0]) ?? 0, parseFloat(value[1]) ?? 0, parseFloat(value[2]) ?? 0, parseFloat(value[3]) ?? 0]
        } else if (typeof value === "number") {
            vals[0] = vals[1] = vals[2] = vals[3] = value
        }
        style.paddingTop = value == null ? new StyleLength(StyleKeyword.Initial) : new StyleLength(new Length(vals[0]))
        style.paddingRight = value == null ? new StyleLength(StyleKeyword.Initial) : new StyleLength(new Length(vals[1]))
        style.paddingBottom = value == null ? new StyleLength(StyleKeyword.Initial) : new StyleLength(new Length(vals[2]))
        style.paddingLeft = value == null ? new StyleLength(StyleKeyword.Initial) : new StyleLength(new Length(vals[3]))
    }
}

globalThis.__setStyleProperty = function (style, key, value) {
    styleProcessors[key](style, value)
}