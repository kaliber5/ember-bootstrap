import { module, skip } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, render, settled, waitFor, waitUntil } from '@ember/test-helpers';
import test from 'ember-sinon-qunit/test-support/test';
import hbs from 'htmlbars-inline-precompile';
import setupStylesheetSupport from '../../helpers/setup-stylesheet-support';
import { versionDependent } from '../../helpers/bootstrap-test';

const DEFAULT_DELAY = 500;
const DEFAULT_TRANSITION_DURATION = 150;

versionDependent(skip, module)('Integration | Component | bs-toast', function(hooks) {
  setupRenderingTest(hooks);
  setupStylesheetSupport(hooks);

  module('visibility', function() {
    test('toast is shown by default', async function(assert) {
      this.set('show', true);
      await render(hbs`<BsToast @show={{show}} @autohide={{false}} />`);
      assert.dom('.toast').hasClass('show');
    });

    test('toast is not shown if @show is `false`', async function(assert) {
      this.set('show', false);
      await render(hbs`<BsToast @show={{show}} @autohide={{false}} />`);
      assert.dom('.toast').hasClass('hide');
    });

    test('toast is shown if @show changes from `false` to `true`', async function(assert) {
      this.set('show', false);
      await render(hbs`<BsToast @show={{show}} @autohide={{false}} />`);

      this.set('show', true);
      await settled();
      assert.dom('.toast').hasClass('show');
    });

    test('toast is hidden if @show changes from `true` to `false', async function(assert) {
      this.set('show', true);
      await render(hbs`<BsToast @show={{show}} @autohide={{false}} />`);

      this.set('show', false);
      await settled();
      assert.dom('.toast').hasClass('hide');
    });
  });

  module('interaction', function() {
    test('it hides toast if user clicks close button', async function(assert) {
      await render(hbs`<BsToast @autohide={{false}} />`);
      await click('.close');

      assert.dom('.toast').hasClass('hide');
    });
  });

  module('animations', function() {
    test('it animates toast', async function(assert) {
      this.sandbox.useFakeTimers();

      render(hbs`<BsToast />`);

      // can not await render as that does not resolve before toast is hidden
      await waitFor('.toast');

      assert.dom('.toast').hasClass('fade');
      assert.dom('.toast').hasClass('showing');

      this.sandbox.clock.tick(DEFAULT_TRANSITION_DURATION);
      assert.dom('.toast').doesNotHaveClass('showing');
      assert.dom('.toast').hasClass('show');

      this.sandbox.clock.tick(DEFAULT_DELAY);
      assert.dom('.toast').hasClass('fade');
      assert.dom('.toast').doesNotHaveClass('show');

      this.sandbox.clock.tick(DEFAULT_TRANSITION_DURATION);
      assert.dom('.toast').hasClass('hide');
    });

    test('it determines animation duration by element\'s transition style', async function(assert) {
      this.sandbox.useFakeTimers();

      // tests asserts that setting a custom transition duration on that element
      // which is longer than default one cause the transition to be still
      // ongoing after default time is exceeded but being finished after additional
      // time has passed
      let additionalTransitionDuration = 50;
      this.insertCSSRule(`.fade {
        transition-duration: ${DEFAULT_TRANSITION_DURATION + additionalTransitionDuration}ms;
      }`);

      render(hbs`<BsToast @autohide={{false}} />`);

      // can not await render as that does not resolve before toast is hidden
      await waitFor('.toast');

      this.sandbox.clock.tick(DEFAULT_TRANSITION_DURATION);
      assert.dom('.toast').hasClass('showing');

      this.sandbox.clock.tick(additionalTransitionDuration);
      assert.dom('.toast').hasClass('show');
    });
  });

  module('autohide', function() {
    test('it hides toast automatically by default', async function(assert) {
      await render(hbs`<BsToast />`);

      // test helpers will not consider application to be settled
      // before timer to hide toast is exceeded
      assert.dom('.toast').hasClass('hide');
    });

    test('it does not hide the toast automatically if `autohide` is `false`', async function(assert) {
      await render(hbs`<BsToast @autohide={{false}} />`);

      assert.dom('.toast').doesNotHaveClass('hide');
    });

    test('`delay` property allows to configure time toast is shown', async function(assert) {
      this.sandbox.useFakeTimers();

      let delay = DEFAULT_TRANSITION_DURATION * 2;
      this.set('delay', delay);
      render(hbs`<BsToast @delay={{delay}} />`);

      // can not await render cause that would mean to wait until
      // all timers including autohide timer, to be finished
      await waitFor('.toast');

      this.sandbox.clock.tick(DEFAULT_TRANSITION_DURATION);
      assert.dom('.toast').hasClass('show');

      this.sandbox.clock.tick(delay);
      assert.dom('.toast').doesNotHaveClass('show');

      this.sandbox.clock.tick(DEFAULT_TRANSITION_DURATION);
      assert.dom('.toast').hasClass('hide');

      this.sandbox.clock.uninstall();
    });
  });

  module('events', function() {
    test('it executes `onShown` action', async function(assert) {
      let onShownStub = this.stub();
      this.set('onShown', onShownStub);

      await render(hbs`<BsToast @autohide={{false}} @onShown={{this.onShown}} />`);

      assert.ok(onShownStub.calledOnce);
    });

    test('it executes `onHide` action if cloded by autohide', async function(assert) {
      let onHideStub = this.stub();
      this.set('onHide', onHideStub);

      render(hbs`<BsToast @onHide={{this.onHide}} />`);
      await waitUntil(() => onHideStub.calledOnce, {
        timeoutMessage: 'onHide stub was not executed before timeout',
      });

      assert.dom('.toast')
        .doesNotHaveClass('.hide', 'onHide action is executed before hide animation starts');
    });

    test('it executes `onHide` action if closed manually', async function(assert) {
      let onHideStub = this.stub();
      this.set('onHide', onHideStub);

      render(hbs`<BsToast @autohide={{false}} @onHide={{this.onHide}} />`);

      // must await until toast including close button is fully rendered
      await waitFor('.close');

      click('.close');
      await waitUntil(() => onHideStub.calledOnce, {
        timeoutMessage: 'onHide stub was not executed before timeout',
      });

      assert.dom('.toast')
        .doesNotHaveClass('.hide', 'onHide action is executed before hide animation starts');
    });

    test('it executes `onHidden` action if closed by autohide', async function(assert) {
      let onHiddenStub = this.stub();
      this.set('onHidden', onHiddenStub);

      await render(hbs`<BsToast @onHidden={{this.onHidden}} />`);

      assert.ok(onHiddenStub.calledOnce);
    });

    test('it executes `onHidden` action if closed manually', async function(assert) {
      let onHiddenStub = this.stub();
      this.set('onHidden', onHiddenStub);

      await render(hbs`<BsToast @autohide={{false}} @onHidden={{this.onHidden}} />`);
      await click('button.close');

      assert.ok(onHiddenStub.calledOnce);
    });
  });
});
