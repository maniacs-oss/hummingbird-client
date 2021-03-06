import Mixin from 'ember-metal/mixin';
import get from 'ember-metal/get';
import set from 'ember-metal/set';
import getOwner from 'ember-owner/get';
import { scheduleOnce } from 'ember-runloop';
import { classify } from 'ember-string';
import { hrefTo } from 'ember-href-to/helpers/href-to';

/**
 * Generate a BreadcrumbList schema for ember-cli-head.
 *
 * Some code here was heavily borrowed from ember-crumbly by poteto.
 */
export default Mixin.create({
  didTransition() {
    this._super(...arguments);
    scheduleOnce('afterRender', () => {
      const data = this._schemaData();
      const head = get(this, 'headData');
      set(head, 'structuredData.meta-breadcrumbs', data);
    });
  },

  _guessRoutePath(routeNames, name, index) {
    const routes = routeNames.slice(0, index + 1);
    if (routes.length === 1) {
      const path = `${name}.index`;
      return this._lookupRoute(path) ? path : name;
    }
    return routes.join('.');
  },

  _lookupRoute(routeName) {
    return getOwner(this).lookup(`route:${routeName}`);
  },

  _schemaData() {
    const data = {
      '@context': 'http://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [{
        '@type': 'ListItem',
        position: 1,
        item: {
          '@id': 'https://kitsu.io',
          name: 'Kitsu'
        }
      }]
    };
    const routeNames = get(this, 'currentRouteName').split('.');
    const filteredRouteNames = routeNames.reject(name => name === 'index');
    filteredRouteNames.forEach((name, index) => {
      const path = this._guessRoutePath(routeNames, name, index);
      const route = this._lookupRoute(path);
      if (!route) { return; } // route couldn't be found?
      const routeCrumb = get(route, 'breadcrumb');
      const breadcrumb = routeCrumb !== undefined ? routeCrumb : classify(name);
      if (breadcrumb === null) { return; }
      data.itemListElement.push({
        '@type': 'ListItem',
        position: data.itemListElement.length + 1,
        item: {
          '@id': `https://kitsu.io${hrefTo(this, path)}`,
          name: breadcrumb
        }
      });
    });
    return data;
  }
});
