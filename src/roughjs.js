import { RoughGenerator } from "roughjs/src/generator"; // we hook into the internals to write the wrapper ourselves
import sketch from "sketch";

// https://github.com/sketch-hq/SketchAPI/issues/694
sketch.ShapePath.fromSVGPath = function monkeyPathFromSVGPath(svgPath) {
  return new sketch.ShapePath({
    sketchObject: MSShapePathLayer.layerWithPath_integralFrame(
      MSPath.pathWithBezierPath(
        SVGPathInterpreter.bezierPathFromCommands(svgPath)
      ),
      true
    )
  });
};

export class RoughSketch {
  constructor(layer, config) {
    this.layer = layer;
    this._init(config);
  }

  _init(config) {
    this.gen = new RoughGenerator(config, this.layer.frame);
  }

  get generator() {
    return this.gen;
  }

  line(x1, y1, x2, y2, options) {
    let d = this.gen.line(x1, y1, x2, y2, options);
    return this.draw(d);
  }

  rectangle(x, y, width, height, options) {
    let d = this.gen.rectangle(x, y, width, height, options);
    return this.draw(d);
  }

  ellipse(x, y, width, height, options) {
    let d = this.gen.ellipse(x, y, width, height, options);
    return this.draw(d);
  }

  circle(x, y, diameter, options) {
    let d = this.gen.circle(x, y, diameter, options);
    return this.draw(d);
  }

  linearPath(points, options) {
    let d = this.gen.linearPath(points, options);
    return this.draw(d);
  }

  polygon(points, options) {
    let d = this.gen.polygon(points, options);
    return this.draw(d);
  }

  arc(x, y, width, height, start, stop, closed, options) {
    let d = this.gen.arc(x, y, width, height, start, stop, closed, options);
    return this.draw(d);
  }

  curve(points, options) {
    let d = this.gen.curve(points, options);
    return this.draw(d);
  }

  path(d, options) {
    let drawing = this.gen.path(d, options);
    return this.draw(drawing);
  }

  draw(drawable) {
    let sets = drawable.sets || [];
    let o = drawable.options || this.gen.defaultOptions;

    // create a group where we will put everything inside
    const group = new sketch.Group({
      frame: {
        x: 0,
        y: 0,
        width: this.layer.frame.width,
        height: this.layer.frame.height
      }
    });

    for (let drawing of sets) {
      let path = null;
      switch (drawing.type) {
        case "path": {
          path = sketch.ShapePath.fromSVGPath(this._opsToPath(drawing));
          path.style.borders = [
            {
              color: o.stroke,
              thickness: o.strokeWidth
            }
          ];
          path.style.fills = [];
          path.parent = group;
          break;
        }
        case "fillPath": {
          path = sketch.ShapePath.fromSVGPath(this._opsToPath(drawing));
          path.style.borders = [];
          path.style.fills = [o.fill];
          path.parent = group;
          break;
        }
        case "fillSketch": {
          path = this._fillSketch(drawing, o);
          path.parent = group;
          break;
        }
        case "path2Dfill": {
          path = sketch.ShapePath.fromSVGPath(drawing.path);
          path.style.borders = [];
          path.style.fills = [o.fill];
          path.parent = group;
          break;
        }
        case "path2Dpattern": {
          const size = drawing.size;
          path = new sketch.Group({
            frame: {
              x: 0,
              y: 0,
              width: this.layer.frame.width,
              height: this.layer.frame.height
            }
          });

          const mask = sketch.ShapePath.fromSVGPath(drawing.path);
          mask.style.borders = [];
          mask.style.fills = [];

          mask.parent = path;

          const hash = this._fillSketch(drawing, o);
          hash.parent = path;

          mask.sketchObject.hasClippingMask = true;
          mask.sketchObject.clippingMaskMode = 0;
          path.parent = group;
          path.adjustToFit();

          hash.frame = {
            width: hash.frame.width,
            height: hash.frame.height,
            x: 0,
            y: 0
          };
          break;
        }
      }
    }

    group.adjustToFit();
    return group;
  }

  _fillSketch(drawing, o) {
    let fweight = o.fillWeight;
    if (fweight < 0) {
      fweight = o.strokeWidth / 2;
    }
    let path = sketch.ShapePath.fromSVGPath(this._opsToPath(drawing));
    path.style.borders = [
      {
        color: o.fill,
        thickness: fweight
      }
    ];
    path.style.fills = [];
    return path;
  }

  _opsToPath(drawing) {
    return this.gen.opsToPath(drawing);
  }
}
