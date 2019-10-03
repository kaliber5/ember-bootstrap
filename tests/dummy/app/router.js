import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('demo', { path: '/components' }, function() {
    this.route('accordion');
    this.route('alert');
    this.route('button');
    this.route('button-group');
    this.route('carousel');
    this.route('collapse');
    this.route('dropdown');
    this.route('forms');
    this.route('modal');
    this.route('navbars');
    this.route('navs');
    this.route('popover');
    this.route('progress');
    this.route('tabs', function() {
      this.route('other');
    });
    this.route('toast');
    this.route('tooltip');
  });
  this.route('getting-started', function() {
    this.route('setup');
    this.route('assets');
    this.route('bootstrap-4');
  });
  this.route('addons');
  this.route('license');
  this.route('changelog');
  this.route('acceptance', function() {
    this.route('modal');
    this.route('link', { path: '/link/:model' });
    this.route('linkto', { path: '/linkto/:model' });
  });
});

export default Router;
