import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('bs-navbar', 'Integration | Component | bs-navbar', {
  integration: true
});

test('it renders', function(assert) {
  this.render(hbs`{{bs-navbar}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#bs-navbar}}
      template block text
    {{/bs-navbar}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});

test('it has correct default markup', function(assert) {
  this.render(hbs`{{bs-navbar}}`);

  assert.equal(this.$('nav').length, 1, 'there is only one nav element');
  assert.ok(this.$('nav').hasClass('navbar'), 'the navbar has the navbar class');
  assert.ok(this.$('nav').hasClass('navbar-default'), 'the navbar has the navbar-default class');
  assert.equal(this.$('nav > div').length, 1, 'there is a div right under the nav element');
  assert.ok(this.$('nav > div').hasClass('container-fluid'), 'the div is a fluid container');
});

test('it handles inverse navbars properly', function(assert) {
  this.render(hbs`{{bs-navbar type="inverse"}}`);

  assert.ok(this.$('nav').hasClass('navbar-inverse'), 'the navbar has the navbar-inverse class');
  assert.notOk(this.$('nav').hasClass('navbar-default'), 'the navbar does not have the navbar-default class');
});

test('it handles fluid containers properly', function(assert) {
  this.render(hbs`{{bs-navbar fluid=false}}`);

  assert.ok(this.$('nav > div').hasClass('container'), 'the wrapping div has the container class');
  assert.notOk(this.$('nav > div').hasClass('container-fluid'), 'the wrapping div does not have the container-fluid class');
});

test('it handles the toggling action propoerly', function(assert) {
  this.render(hbs`
    {{#bs-navbar as |navbar|}}
      {{#bs-navbar-toggle class="clickme"}}{{navbar.collapsed}}{{/bs-navbar-toggle}}
    {{/bs-navbar}}
  `);

  assert.equal(this.$('button').text().trim(), 'true', 'ensure the default state of the property');

  let done = assert.async();

  this.$('button').click();
  setTimeout(() => {
    assert.equal(this.$('button').text().trim(), 'false', 'ensure the toggled state of the property');

    done();
  }, 500);
});

test('it exposes all the requisite contextual components', function(assert) {
  this.render(hbs`
    {{#bs-navbar as | navbar | }}
      <div class="navbar-header">
        {{bs-navbar-toggle}}
        <a class="navbar-brand" href="#">Brand</a>
      </div>
      {{#navbar.content}}
      {{/navbar.content}}
    {{/bs-navbar}}
  `);

  assert.equal(this.$('nav.navbar-default').length, 1, 'it has the navbar');
  assert.equal(this.$('nav.navbar-default .navbar-collapse').length, 1, 'it has the navbar content');
});

test('it nas no positional classes when position is not specified', function(assert) {
  this.render(hbs`{{bs-navbar}}`);

  assert.notOk(this.$('nav').hasClass('navbar-fixed-top'), 'it does not have navbar-fixed-top');
  assert.notOk(this.$('nav').hasClass('navbar-fixed-bottom'), 'it does not have navbar-fixed-bottom');
  assert.notOk(this.$('nav').hasClass('navbar-static-top'), 'it does not have navbar-static-top');
});

test('it handles fixed-top properly', function(assert) {
  this.render(hbs`{{bs-navbar position="fixed-top"}}`);

  assert.ok(this.$('nav').hasClass('navbar-fixed-top'), 'it has navbar-fixed-top');
  assert.notOk(this.$('nav').hasClass('navbar-fixed-bottom'), 'it does not have navbar-fixed-bottom');
  assert.notOk(this.$('nav').hasClass('navbar-static-top'), 'it does not have navbar-static-top');
});

test('it handles fixed-bottom properly', function(assert) {
  this.render(hbs`{{bs-navbar position="fixed-bottom"}}`);

  assert.notOk(this.$('nav').hasClass('navbar-fixed-top'), 'it does not have navbar-fixed-top');
  assert.ok(this.$('nav').hasClass('navbar-fixed-bottom'), 'it has navbar-fixed-bottom');
  assert.notOk(this.$('nav').hasClass('navbar-static-top'), 'it does not have navbar-static-top');
});

test('it handles static-top properly', function(assert) {
  this.render(hbs`{{bs-navbar position="static-top"}}`);

  assert.notOk(this.$('nav').hasClass('navbar-fixed-top'), 'it does not have navbar-fixed-top');
  assert.notOk(this.$('nav').hasClass('navbar-fixed-bottom'), 'it does not have navbar-fixed-bottom');
  assert.ok(this.$('nav').hasClass('navbar-static-top'), 'it has navbar-static-top');
});
