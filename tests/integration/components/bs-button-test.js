import { run } from '@ember/runloop';
import { defer, reject, resolve } from 'rsvp';
import { module, skip } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { find, render, click, settled, waitUntil } from '@ember/test-helpers';
import { test, testNotBS3, defaultButtonClass, testForBootstrap } from '../../helpers/bootstrap';
import { gte } from 'ember-compatibility-helpers';
import hbs from 'htmlbars-inline-precompile';
import setupNoDeprecations from '../../helpers/setup-no-deprecations';
import a11yAudit from 'ember-a11y-testing/test-support/audit';
import sinon from 'sinon';

module('Integration | Component | bs-button', function (hooks) {
  setupRenderingTest(hooks);
  setupNoDeprecations(hooks);

  hooks.beforeEach(function () {
    this.actions = {};
    this.send = (actionName, ...args) => this.actions[actionName].apply(this, args);
  });

  test('button has correct default markup', async function (assert) {
    await render(hbs`<BsButton>Test</BsButton>`);

    assert.dom('button').hasClass('btn', 'button has btn class');
    assert.dom('button').hasClass(defaultButtonClass(), 'button has type class');
  });

  test('button has correct size', async function (assert) {
    await render(hbs`<BsButton @size="lg">Test</BsButton>`);

    assert.dom('button').hasClass('btn-lg', 'button has size class');
  });

  test('button has correct type', async function (assert) {
    await render(hbs`<BsButton @type="primary">Test</BsButton>`);

    assert.dom('button').hasClass('btn', 'button has btn class');
    assert.dom('button').hasClass('btn-primary', 'button has type class');
    assert.dom('button').doesNotHaveClass('btn-outline-primary', 'button does not have outline class');
  });

  test('button can be active', async function (assert) {
    await render(hbs`<BsButton @active={{true}}>Test</BsButton>`);

    assert.dom('button').hasClass('active', 'button has active class');
  });

  testForBootstrap([3, 4], 'button can be block', async function (assert) {
    await render(hbs`<BsButton @block={{true}}>Test</BsButton>`);

    assert.dom('button').hasClass('btn-block', 'button has block class');
  });

  test('button has HTML attributes', async function (assert) {
    await render(hbs`<BsButton id="test" disabled={{true}} title="title" type="submit">Test</BsButton>`);

    assert.equal(this.element.querySelector('button').getAttribute('id'), 'test');
    assert.equal(this.element.querySelector('button').getAttribute('disabled'), '');
    assert.equal(this.element.querySelector('button').getAttribute('title'), 'title');
    // assert.equal(this.element.querySelector('button').getAttribute('type'), 'submit');
  });

  test('button has default label', async function (assert) {
    await render(hbs`<BsButton @defaultText="test" />`);
    assert.dom('button').hasText('test');
  });

  test('button has default type "button"', async function (assert) {
    await render(hbs`<BsButton />`);
    assert.equal(this.element.querySelector('button').type, 'button');
  });

  test('buttonType property allows changing button type', async function (assert) {
    await render(hbs`<BsButton @buttonType="submit" />`);

    assert.dom('button').hasAttribute('type', 'submit');
    // assert.deprecationsInclude('Argument buttonType of <BsButton> component is deprecated.');
  });

  test('button with icon property shows icon', async function (assert) {
    await render(hbs`<BsButton @icon="fas fa-check" />`);

    assert.dom('button i').hasClass('fas');
    assert.dom('button i').hasClass('fa-check');
  });

  testNotBS3('button with outline property shows as outline', async function (assert) {
    await render(hbs`<BsButton @type="primary" @outline={{true}} />`);
    assert.dom('button').hasClass('btn-outline-primary');
    assert.dom('button').doesNotHaveClass('btn-primary');
  });

  test('button with iconActive and iconInactive properties shows icon depending on active state', async function (assert) {
    this.set('active', false);
    await render(hbs`<BsButton @active={{this.active}} @iconInactive="fas fa-plus" @iconActive="fas fa-minus" />`);

    assert.dom('button i').hasClass('fas');
    assert.dom('button i').hasClass('fa-plus');

    this.set('active', true);

    assert.dom('button i').hasClass('fas');
    assert.dom('button i').hasClass('fa-minus');

    this.set('active', false);

    assert.dom('button i').hasClass('fas');
    assert.dom('button i').hasClass('fa-plus');
  });

  test('clicking a button sends onClick action with "value" property as a parameter', async function (assert) {
    let action = sinon.spy();
    this.actions.testAction = action;
    await render(hbs`<BsButton @onClick={{action "testAction"}} @value="dummy" />`);

    await click('button');
    assert.ok(action.calledWith('dummy'), 'onClick action has been called with button value');
  });

  test('button text is changed according to button state', async function (assert) {
    let deferredClickAction = defer();
    this.set('clickAction', () => {
      return deferredClickAction.promise;
    });

    await render(hbs`
      <BsButton
        @defaultText="default text"
        @pendingText="text for pending state"
        @fulfilledText="text for fulfilled state"
        @rejectedText="text for rejected state"
        @onClick={{this.clickAction}}
      />
    `);
    assert.dom('button').hasText('default text');

    click('button');
    await waitUntil(() => {
      return find('button').textContent.trim() === 'text for pending state';
    });

    deferredClickAction.resolve();
    await settled();
    assert.dom('button').hasText('text for fulfilled state');

    deferredClickAction = defer();
    click('button');
    await waitUntil(() => {
      return find('button').textContent.trim() === 'text for pending state';
    });

    deferredClickAction.reject();
    await settled();
    assert.dom('button').hasText('text for rejected state');
  });

  test("button text remains to default if no state text wasn't set", async function (assert) {
    let deferredClickAction = defer();
    this.set('clickAction', () => {
      return deferredClickAction.promise;
    });

    await render(hbs`<BsButton @defaultText="default text" @onClick={{this.clickAction}} />`);
    assert.dom('button').hasText('default text');

    click('button');
    await waitUntil(() => {
      return find('button').textContent.trim() === 'default text';
    });

    deferredClickAction.resolve();
    await settled();
    assert.dom('button').hasText('default text');

    deferredClickAction = defer();
    click('button');
    await waitUntil(() => {
      return find('button').textContent.trim() === 'default text';
    });

    deferredClickAction.reject();
    await settled();
    assert.dom('button').hasText('default text');
  });

  test('setting reset to true resets button text', async function (assert) {
    this.set('clickAction', () => {
      return resolve();
    });

    await render(hbs`
      <BsButton @defaultText="default text" @fulfilledText="text for fulfilled state" @reset={{this.reset}} @onClick={{this.clickAction}} />
    `);
    assert.dom('button').hasText('default text');

    await click('button');
    assert.dom('button').hasText('text for fulfilled state');

    run(() => this.set('reset', true));
    assert.dom('button').hasText('default text');
  });

  test('button is disabled while in pending state', async function (assert) {
    let deferredClickAction = defer();
    this.set('clickAction', () => {
      return deferredClickAction.promise;
    });

    await render(hbs`<BsButton @onClick={{this.clickAction}} />`);
    assert.dom('button').isNotDisabled();

    await click('button');
    assert.dom('button').isDisabled();

    deferredClickAction.resolve();
    await settled();
    assert.dom('button').isNotDisabled();
  });

  test('button is not disabled while in pending state if preventConcurrency is false', async function (assert) {
    let deferredClickAction = defer();
    this.set('clickAction', () => {
      return deferredClickAction.promise;
    });

    await render(hbs`<BsButton @onClick={{this.clickAction}} @preventConcurrency={{false}} />`);
    await click('button');
    assert.dom('button').isNotDisabled();

    deferredClickAction.resolve();
    await settled();
  });

  (gte('3.4.0')
    ? test
    : skip)('setting disabled HTML attribute to false prevents button from being disabled while in pending state', async function (assert) {
    let deferredClickAction = defer();
    this.set('clickAction', () => {
      return deferredClickAction.promise;
    });

    await render(hbs`<BsButton @onClick={{this.clickAction}} disabled={{false}} />`);
    await click('button');
    assert.dom('button').isNotDisabled();

    deferredClickAction.resolve();
    await settled();
  });

  test('isPending, isFulfilled and isRejected properties are yielded', async function (assert) {
    let deferredClickAction = defer();
    this.set('clickAction', () => {
      return deferredClickAction.promise;
    });
    await render(hbs`
      <BsButton @reset={{this.reset}} @onClick={{this.clickAction}} as |button|>
        {{#if button.isPending}}isPending{{/if}}
        {{#if button.isFulfilled}}isFulfilled{{/if}}
        {{#if button.isRejected}}isRejected{{/if}}
      </BsButton>
    `);
    assert.dom('button').hasText('');

    click('button');
    await waitUntil(() => {
      return find('button').textContent.trim() === 'isPending';
    });

    deferredClickAction.resolve();
    await settled();
    assert.dom('button').hasText('isFulfilled');

    deferredClickAction = defer();
    click('button');
    await waitUntil(() => {
      return find('button').textContent.trim() === 'isPending';
    });

    deferredClickAction.reject();
    await settled();
    assert.dom('button').hasText('isRejected');

    run(() => this.set('reset', true));

    assert.dom('button').hasText('');
  });

  test('isSettled shorthand is yielded', async function (assert) {
    this.set('clickAction', () => {
      return resolve();
    });
    await render(hbs`
      <BsButton @reset={{this.reset}} @onClick={{this.clickAction}} as |button|>
        {{#if button.isSettled}}isSettled{{/if}}
      </BsButton>
    `);

    assert.dom('button').hasText('');

    await click('button');
    assert.dom('button').hasText('isSettled');

    run(() => this.set('reset', true));
    assert.dom('button').hasText('');

    this.set('clickAction', () => {
      return reject();
    });
    await click('button');
    assert.dom('button').hasText('isSettled');
  });

  test('clicking a button with onClick action will prevent event to bubble up', async function (assert) {
    let buttonClick = sinon.spy();
    this.actions.buttonClick = buttonClick;
    let parentClick = sinon.spy();
    this.actions.parentClick = parentClick;

    await render(
      hbs`<div {{action "parentClick"}} role="button"><BsButton @onClick={{action "buttonClick"}}>Button</BsButton></div>`
    );

    await click('button');
    assert.ok(buttonClick.called);
    assert.notOk(parentClick.called);
  });

  test('clicking a button without onClick action will cause event to bubble up', async function (assert) {
    let parentClick = sinon.spy();
    this.actions.parentClick = parentClick;

    await render(hbs`<div {{action "parentClick"}} role="button"><BsButton>Button</BsButton></div>`);

    await click('button');
    assert.ok(parentClick.called);
  });

  test('clicking a button with onClick action and bubble=true will cause event to bubble up', async function (assert) {
    let buttonClick = sinon.spy();
    this.actions.buttonClick = buttonClick;
    let parentClick = sinon.spy();
    this.actions.parentClick = parentClick;

    await render(hbs`
      <div {{action "parentClick"}} role="button">
        <BsButton @bubble={{true}} @onClick={{action "buttonClick"}}>Button</BsButton>
      </div>
    `);

    await click('button');
    assert.ok(buttonClick.called);
    assert.ok(parentClick.called);
  });

  test('prevents onClick action to be fired concurrently', async function (assert) {
    let deferredClickAction = defer();
    let clickActionHasBeenExecuted = false;
    this.set('clickAction', () => {
      clickActionHasBeenExecuted = true;
      return deferredClickAction.promise;
    });

    await render(hbs`<BsButton @onClick={{this.clickAction}} />`);
    click('button');
    await waitUntil(() => clickActionHasBeenExecuted);

    this.set('clickAction', () => {
      assert.ok(false, 'onClick action is not executed concurrently');
    });
    try {
      await click('button');
    } catch (e) {
      // click helper will throw on a disabled button
    }

    deferredClickAction.resolve();
    await settled();

    this.set('clickAction', () => {
      assert.step('onClick action');
    });
    await click('button');
    assert.verifySteps(['onClick action'], 'onClick action is fired again after pending click action is settled');
  });

  test('preventConcurrency=false allows onClick action to be fired concurrently', async function (assert) {
    let deferredClickAction = defer();
    let clickActionExecutionCount = 0;

    this.set('clickAction', () => {
      clickActionExecutionCount++;
      return deferredClickAction.promise;
    });
    await render(hbs`<BsButton @onClick={{this.clickAction}} @preventConcurrency={{false}} />`);

    await click('button');
    assert.equal(clickActionExecutionCount, 1);

    await click('button');
    assert.equal(clickActionExecutionCount, 2);

    deferredClickAction.resolve();
  });

  test('it passes accessibility checks', async function (assert) {
    await render(hbs`<BsButton>Test</BsButton>`);

    await a11yAudit();
    assert.ok(true, 'A11y audit passed');
  });
});
