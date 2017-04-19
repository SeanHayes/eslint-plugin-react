/**
 * @fileoverview Prevent usage of deprecated methods
 * @author Yannick Croissant
 * @author Scott Feeney
 */
'use strict';

var pragmaUtil = require('../util/pragma');
var versionUtil = require('../util/version');

// ------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------

var DEPRECATED_MESSAGE = '{{oldMethod}} is deprecated since React {{version}}{{newMethod}}';

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

module.exports = {
  meta: {
    docs: {
      description: 'Prevent usage of deprecated methods',
      category: 'Best Practices',
      recommended: true
    },
    schema: []
  },

  create: function(context) {

    var sourceCode = context.getSourceCode();
    var pragma = pragmaUtil.getFromContext(context);

    function getDeprecated() {
      var deprecated = {};
      // 0.12.0
      deprecated[pragma + '.renderComponent'] = ['0.12.0', pragma + '.render'];
      deprecated[pragma + '.renderComponentToString'] = ['0.12.0', pragma + '.renderToString'];
      deprecated[pragma + '.renderComponentToStaticMarkup'] = ['0.12.0', pragma + '.renderToStaticMarkup'];
      deprecated[pragma + '.isValidComponent'] = ['0.12.0', pragma + '.isValidElement'];
      deprecated[pragma + '.PropTypes.component'] = ['0.12.0', pragma + '.PropTypes.element'];
      deprecated[pragma + '.PropTypes.renderable'] = ['0.12.0', pragma + '.PropTypes.node'];
      deprecated[pragma + '.isValidClass'] = ['0.12.0'];
      deprecated['this.transferPropsTo'] = ['0.12.0', 'spread operator ({...})'];
      // 0.13.0
      deprecated[pragma + '.addons.classSet'] = ['0.13.0', 'the npm module classnames'];
      deprecated[pragma + '.addons.cloneWithProps'] = ['0.13.0', pragma + '.cloneElement'];
      // 0.14.0
      deprecated[pragma + '.render'] = ['0.14.0', 'ReactDOM.render'];
      deprecated[pragma + '.unmountComponentAtNode'] = ['0.14.0', 'ReactDOM.unmountComponentAtNode'];
      deprecated[pragma + '.findDOMNode'] = ['0.14.0', 'ReactDOM.findDOMNode'];
      deprecated[pragma + '.renderToString'] = ['0.14.0', 'ReactDOMServer.renderToString'];
      deprecated[pragma + '.renderToStaticMarkup'] = ['0.14.0', 'ReactDOMServer.renderToStaticMarkup'];
      // 15.0.0
      deprecated[pragma + '.addons.LinkedStateMixin'] = ['15.0.0'];
      deprecated['ReactPerf.printDOM'] = ['15.0.0', 'ReactPerf.printOperations'];
      deprecated['Perf.printDOM'] = ['15.0.0', 'Perf.printOperations'];
      deprecated['ReactPerf.getMeasurementsSummaryMap'] = ['15.0.0', 'ReactPerf.getWasted'];
      deprecated['Perf.getMeasurementsSummaryMap'] = ['15.0.0', 'Perf.getWasted'];
      // 15.5.0
      deprecated[pragma + '.createClass'] = ['15.5.0', 'the npm module create-react-class'];
      deprecated[pragma + '.PropTypes'] = ['15.5.0', 'the npm module prop-types'];

      return deprecated;
    }

    function isDeprecated(method) {
      var deprecated = getDeprecated();

      return (
        deprecated &&
        deprecated[method] &&
        versionUtil.test(context, deprecated[method][0])
      );
    }

    function checkDeprecation(node, method) {
      if (!isDeprecated(method)) {
        return;
      }
      var deprecated = getDeprecated();
      context.report({
        node: node,
        message: DEPRECATED_MESSAGE,
        data: {
          oldMethod: method,
          version: deprecated[method][0],
          newMethod: deprecated[method][1] ? ', use ' + deprecated[method][1] + ' instead' : ''
        }
      });
    }

    // --------------------------------------------------------------------------
    // Public
    // --------------------------------------------------------------------------

    return {

      MemberExpression: function(node) {
        checkDeprecation(node, sourceCode.getText(node));
      },

      ImportDeclaration: function(node) {
        var isReactImport = node.source.value === 'react';
        if (!isReactImport) {
          return;
        }
        node.specifiers.forEach(function(specifier) {
          if (!specifier.imported) {
            return;
          }
          checkDeprecation(node, pragma + '.' + specifier.imported.name);
        });
      },

      VariableDeclarator: function(node) {
        var isRequire = node.init && node.init.callee && node.init.callee.name === 'require';
        var isReactRequire =
          node.init && node.init.arguments &&
          node.init.arguments.length && node.init.arguments[0].value === 'react'
        ;
        var isDestructuring = node.id && node.id.type === 'ObjectPattern';
        var isReactDestructuring = node.init && node.init.name === 'React';
        if (
          !(isDestructuring && isReactDestructuring) &&
          !(isDestructuring && isRequire && isReactRequire)
        ) {
          return;
        }
        node.id.properties.forEach(function(property) {
          checkDeprecation(node, pragma + '.' + property.key.name);
        });
      },

      BlockComment: function(node) {
        pragma = pragmaUtil.getFromNode(node) || pragma;
      }

    };

  }
};
