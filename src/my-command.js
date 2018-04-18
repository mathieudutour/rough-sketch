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

  const fill = (layer.style.fills || []).filter(
    f => f.sketchObject.isEnabled() && f.fill === 'Color'
  )[0]

  if (fill) {
    options.fill = fill.color
  }

  const border = (layer.style.borders || []).filter(
    f => f.sketchObject.isEnabled() && f.fillType === 'Color'
  )[0]

  if (border) {
    options.stroke = border.color
    options.strokeWidth = border.thickness
  } else {
    options.stroke = '#00000000'
  }

  return options
}

export default function(context) {
  const document = sketch.getSelectedDocument()

  const selection = document.selectedLayers

  if (selection.isEmpty) {
    return
  }

  selection.forEach(layer => {
    if (layer.type !== 'Shape') {
      return
    }

    const rc = new RoughSketch(layer.parent)
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
  })
}
