import sketch from 'sketch'
import {RoughSketch} from './roughjs'

function getPathFromLayer(layer) {
  const nsbezierpath = NSBezierPath.bezierPathWithPath(layer.sketchObject.pathInFrameWithTransforms())

  return String(nsbezierpath.svgPathAttribute())
    .replace(/^d="/g, '')
    .replace(/"$/g, '')
}

function getOptionsFromLayer(layer) {
  let options = {}

  if (!layer.style) {
    options.fill = '#000000'
    return
  }

  const fill = (layer.style.fills || []).filter(
    f => f.sketchObject.isEnabled() && f.fill === sketch.Style.FillType.Color
  )[0]

  if (fill) {
    options.fill = fill.color
  }

  const border = (layer.style.borders || []).filter(
    f => f.sketchObject.isEnabled() && f.fillType === sketch.Style.FillType.Color
  )[0]

  if (border) {
    options.stroke = border.color
    options.strokeWidth = border.thickness
  } else {
    options.stroke = '#00000000'
  }

  if (!fill) {
    if (layer.type === 'Text') {
      options.fill = sketch.Style.colorToString(layer.sketchObject.textColor())
    } else if (!border) {
      options.fill = '#000000'
    }
  }

  return options
}

function makeRough(layer) {
  if (layer.type === 'Group') {
    layer.layers.forEach(makeRough)
    return
  }

  if (!layer.sketchObject.pathInFrameWithTransforms) {
    return
  }

  // override the wrapper to have a proper object
  if (!layer.type) {
    layer = sketch.Shape.fromNative(layer.sketchObject)
  }

  const rc = new RoughSketch(layer.parent.type === 'Page' ? layer : layer.parent)

  const newLayer = rc.path(
    getPathFromLayer(layer),
    getOptionsFromLayer(layer)
  )

  newLayer.name = 'Rough ' + layer.name

  // add new layer to parent
  newLayer.parent = layer.parent

  // hide previous layer
  layer.hidden = true
  layer.selected = false

  // select new one
  newLayer.selected = true
}

export default function(context) {
  const document = sketch.getSelectedDocument()

  const selection = document.selectedLayers

  if (selection.isEmpty) {
    return
  }

  selection.forEach(makeRough)
}
