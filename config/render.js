/**
 * Middleware to attach a helper to the response object. The helper wraps
 * EJS rendering so that all templates are passed through a common layout
 * if desired. In this basic project we just alias res.renderView to
 * res.render for convenience.
 */
function attachRender(app) {
  app.use((req, res, next) => {
    /**
     * Render a view with the given options. This function simply calls
     * res.render. It exists so that routes can call res.renderView
     * consistently, and could be extended in the future to apply a
     * default layout or additional locals.
     *
     * @param {string} view The view to render
     * @param {object} opts Options/locals passed to the template
     */
    res.renderView = function (view, opts = {}) {
      res.render(view, opts);
    };
    next();
  });
}

module.exports = { attachRender };