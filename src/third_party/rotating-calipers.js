(function() {
  var __slice = [].slice;

  module.exports = (function() {
    var _distance, _inputVertices, _quickHull;

    // RotatingCalipers.name = 'RotatingCalipers';

    _inputVertices = null;



    _distance = function(start, end, point) {
      return (point[1] - start[1]) * (end[0] - start[0]) - (point[0] - start[0]) * (end[1] - start[1]);
    };


    _quickHull = function(vertices, start, end) {
      var d, maxDistance, maxPoint, newPoints, vertex, _i, _len;
      maxPoint = null;
      maxDistance = 0;
      newPoints = [];
      for (_i = 0, _len = vertices.length; _i < _len; _i++) {
        vertex = vertices[_i];
        if (!((d = _distance(start, end, vertex)) > 0)) {
          continue;
        }
        newPoints.push(vertex);
        if (d < maxDistance) {
          continue;
        }
        maxDistance = d;
        maxPoint = vertex;
      }

      if (!(maxPoint != null)) {
        return [end];
      }

      return _quickHull(newPoints, start, maxPoint).concat(_quickHull(newPoints, maxPoint, end));
    };

    function RotatingCalipers(verticesOrFirst) {
      var rest, vertex, vertex1, vertex2, vertex3, _i, _len;
      if (!(verticesOrFirst != null)) {
        throw new Error("Argument required");
      }
      if (!(verticesOrFirst instanceof Array) || verticesOrFirst.length < 3) {
        throw new Error("Array of vertices required");
      }
      vertex1 = verticesOrFirst[0], vertex2 = verticesOrFirst[1], vertex3 = verticesOrFirst[2], rest = 4 <= verticesOrFirst.length ? __slice.call(verticesOrFirst, 3) : [];
      for (_i = 0, _len = verticesOrFirst.length; _i < _len; _i++) {
        vertex = verticesOrFirst[_i];
        if (!(vertex instanceof Array) || vertex.length < 2) {
          throw new Error("Invalid vertex");
        }
        if (isNaN(vertex[0]) || isNaN(vertex[1])) {
          throw new Error("Invalid vertex");
        }
      }
      _inputVertices = verticesOrFirst;
    }

    RotatingCalipers.prototype.convexHull = function() {
      var extremeX, finder;
      finder = function(arr) {
        var el, ret, _i, _len;
        ret = {};
        ret.min = ret.max = arr[0];
        for (_i = 0, _len = arr.length; _i < _len; _i++) {
          el = arr[_i];
          if (el[0] < ret.min[0]) {
            ret.min = el;
          }
          if (el[0] > ret.max[0]) {
            ret.max = el;
          }
        }
        return ret;
      };
      extremeX = finder(_inputVertices);
      return _quickHull(_inputVertices, extremeX.min, extremeX.max).concat(_quickHull(_inputVertices, extremeX.max, extremeX.min));
    };

    RotatingCalipers.prototype.angleBetweenVectors = function(vector1, vector2) {
      var dotProduct, magnitude1, magnitude2;
      dotProduct = vector1[0] * vector2[0] + vector1[1] * vector2[1];
      magnitude1 = Math.sqrt(vector1[0] * vector1[0] + vector1[1] * vector1[1]);
      magnitude2 = Math.sqrt(vector2[0] * vector2[0] + vector2[1] * vector2[1]);
      return Math.acos(dotProduct / (magnitude1 * magnitude2));
    };

    RotatingCalipers.prototype.rotateVector = function(vector, angle) {
      var rotated;
      rotated = [];
      rotated[0] = vector[0] * Math.cos(angle) - vector[1] * Math.sin(angle);
      rotated[1] = vector[0] * Math.sin(angle) + vector[1] * Math.cos(angle);
      return rotated;
    };

    RotatingCalipers.prototype.shortestDistance = function(p, t, v) {
      var a, c;
      if (v[0] === 0) {
        return Math.abs(p[0] - t[0]);
      }
      a = v[1] / v[0];
      c = t[1] - a * t[0];
      return Math.abs(p[1] - c - a * p[0]) / Math.sqrt(a * a + 1);
    };

    RotatingCalipers.prototype.intersection = function(point1, vector1, point2, vector2) {
      var b1, b2, m1, m2, point;
      if (vector1[0] === 0 && vector2[0] === 0) {
        return false;
      }
      if (vector1[0] !== 0) {
        m1 = vector1[1] / vector1[0];
        b1 = point1[1] - m1 * point1[0];
      }
      if (vector2[0] !== 0) {
        m2 = vector2[1] / vector2[0];
        b2 = point2[1] - m2 * point2[0];
      }
      if (vector1[0] === 0) {
        return [point1[0], m2 * point1[0] + b2];
      }
      if (vector2[0] === 0) {
        return [point2[0], m1 * point2[0] + b1];
      }
      if (m1 === m2) {
        return false;
      }
      point = [];
      point[0] = (b2 - b1) / (m1 - m2);
      point[1] = m1 * point[0] + b1;
      return point;
    };

    RotatingCalipers.prototype.minAreaEnclosingRectangle = function() {
      var angles, area, caliper, calipers, getEdge, getItem, height, hull, i, idx, minAngle, minArea, minHeight, minPairs, minWidth, point, rotatedAngle, vertices, width, xIndices, _i, _len;
      hull = this.convexHull().reverse();
      xIndices = [0, 0, 0, 0];
      getItem = function(idxOfExtremePointInHull) {
        return hull[idxOfExtremePointInHull % hull.length];
      };
      getEdge = function(idxOfExtremePointInHull) {
        var pointA, pointB;
        pointA = getItem(idxOfExtremePointInHull + 1);
        pointB = getItem(idxOfExtremePointInHull);
        return [pointA[0] - pointB[0], pointA[1] - pointB[1]];
      };
      /*
          Compute all four extreme points for the polygon, store their indices.
      */

      for (idx = _i = 0, _len = hull.length; _i < _len; idx = ++_i) {
        point = hull[idx];
        if (point[1] < hull[xIndices[0]][1]) {
          xIndices[0] = idx;
        }
        if (point[1] > hull[xIndices[1]][1]) {
          xIndices[1] = idx;
        }
        if (point[0] < hull[xIndices[2]][0]) {
          xIndices[2] = idx;
        }
        if (point[0] > hull[xIndices[3]][0]) {
          xIndices[3] = idx;
        }
      }
      rotatedAngle = 0;
      minArea = minWidth = minHeight = null;
      calipers = [[1, 0], [-1, 0], [0, -1], [0, 1]];

      while (rotatedAngle < Math.PI) {
        angles = (function() {
          var _j, _len1, _results;
          _results = [];
          for (i = _j = 0, _len1 = xIndices.length; _j < _len1; i = ++_j) {
            idx = xIndices[i];
            _results.push(this.angleBetweenVectors(getEdge(idx), calipers[i]));
          }
          return _results;
        }).call(this);
        minAngle = Math.min.apply(Math, angles);

        calipers = (function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = calipers.length; _j < _len1; _j++) {
            caliper = calipers[_j];
            _results.push(this.rotateVector(caliper, minAngle));
          }
          return _results;
        }).call(this);
        idx = angles.indexOf(minAngle);

        switch (idx) {
          case 0:
          case 2:
            width = this.shortestDistance(getItem(xIndices[1]), getItem(xIndices[0]), calipers[0]);
            height = this.shortestDistance(getItem(xIndices[3]), getItem(xIndices[2]), calipers[2]);
            break;
          case 1:
            width = this.shortestDistance(getItem(xIndices[0]), getItem(xIndices[1]), calipers[1]);
            height = this.shortestDistance(getItem(xIndices[3]), getItem(xIndices[2]), calipers[2]);
            break;
          case 3:
            width = this.shortestDistance(getItem(xIndices[1]), getItem(xIndices[0]), calipers[0]);
            height = this.shortestDistance(getItem(xIndices[2]), getItem(xIndices[3]), calipers[3]);
        }
        rotatedAngle += minAngle;
        area = width * height;

        if (!(minArea != null) || area < minArea) {
          minArea = area;
          minPairs = (function() {
            var _j, _results;
            _results = [];
            for (i = _j = 0; _j < 4; i = ++_j) {
              _results.push([getItem(xIndices[i]), calipers[i]]);
            }
            return _results;
          })();
          minWidth = width;
          minHeight = height;
        }

        xIndices[idx]++;
      }
      vertices = [this.intersection(minPairs[0][0], minPairs[0][1], minPairs[3][0], minPairs[3][1]), this.intersection(minPairs[3][0], minPairs[3][1], minPairs[1][0], minPairs[1][1]), this.intersection(minPairs[1][0], minPairs[1][1], minPairs[2][0], minPairs[2][1]), this.intersection(minPairs[2][0], minPairs[2][1], minPairs[0][0], minPairs[0][1])];
      return {
        vertices: vertices,
        width: minWidth,
        height: minHeight,
        area: minArea
      };
    };

    return RotatingCalipers;

  })();

}).call(this);