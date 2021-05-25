import { module, skip } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, focus, render, settled, triggerKeyEvent, waitUntil } from '@ember/test-helpers';
import {
  defaultButtonClass,
  test,
  testNotBS3,
  testRequiringFocus,
  testRequiringTransitions,
  visibilityClass,
} from '../../helpers/bootstrap';
import hbs from 'htmlbars-inline-precompile';
import setupNoDeprecations from '../../helpers/setup-no-deprecations';
import a11yAudit from 'ember-a11y-testing/test-support/audit';
import sinon from 'sinon';

module('Integration | Component | bs-modal-simple', function (hooks) {
  setupRenderingTest(hooks);
  setupNoDeprecations(hooks);

  hooks.beforeEach(function () {
    this.actions = {};
    this.send = (actionName, ...args) => this.actions[actionName].apply(this, args);
  });

  test('Simple modal has header, footer and body', async function (assert) {
    await render(hbs`<BsModalSimple @fade={{false}} @title="Simple Dialog">Hello world!</BsModalSimple>`);

    assert.dom('.modal').exists({ count: 1 }, 'Modal exists.');
    assert.dom('.modal .modal-header').exists({ count: 1 }, 'Modal has header.');
    assert.dom('.modal .modal-header .modal-title').hasText('Simple Dialog', 'Modal header has correct title.');
    assert.dom('.modal .modal-footer').exists({ count: 1 }, 'Modal has footer.');
    assert.dom('.modal .modal-footer button').exists({ count: 1 }, 'Modal has button in footer.');
    assert.dom('.modal .modal-footer button').hasText('Ok', 'Modal button has default title.');
    assert.dom('.modal .modal-body').exists({ count: 1 }, 'Modal has body.');
    assert.dom('.modal .modal-body').hasText('Hello world!', 'Modal body has correct content.');
  });

  test('Hidden modal does not render', async function (assert) {
    await render(hbs`<BsModalSimple @open={{false}} @title="Simple Dialog">Hello world!</BsModalSimple>`);

    assert.dom('.modal *').doesNotExist('Modal does not exist.');
  });

  test('Simple modal has default CSS classes', async function (assert) {
    await render(hbs`<BsModalSimple @title="Simple Dialog">Hello world!</BsModalSimple>`);

    assert.dom('.modal').hasClass('fade', 'Modal has fade class');
    assert.dom('.modal').hasClass(visibilityClass(), 'Modal has visibility class');
  });

  test('Simple modal supports custom buttons', async function (assert) {
    await render(
      hbs`<BsModalSimple @title="Simple Dialog" @closeTitle="Cancel" @submitTitle="Ok">Hello world!</BsModalSimple>`
    );

    assert.dom(`.modal .modal-footer button.${defaultButtonClass()}`).exists({ count: 1 }, 'Modal has close button.');
    assert
      .dom(`.modal .modal-footer button.${defaultButtonClass()}`)
      .hasText('Cancel', 'Close button has correct title.');
    assert.dom('.modal .modal-footer button.btn-primary').exists({ count: 1 }, 'Modal has submit button.');
    assert.dom('.modal .modal-footer button.btn-primary').hasText('Ok', 'Submit button has correct title.');
  });

  test('Simple modal supports a custom submit button type', async function (assert) {
    await render(
      hbs`<BsModalSimple @closeTitle="Cancel" @submitTitle="Ok" @submitButtonType="danger">Hello world!</BsModalSimple>`
    );

    assert
      .dom('.modal .modal-footer button.btn-danger')
      .exists({ count: 1 }, 'Modal has submit button with btn-danger class.');
  });

  test('open modal is immediately shown', async function (assert) {
    await render(hbs`<BsModalSimple @title="Simple Dialog" @fade={{false}}>Hello world!</BsModalSimple>`);

    assert.dom('.modal').hasClass(visibilityClass(), 'Modal is visible');
    assert.dom('.modal').isVisible();
  });

  testRequiringTransitions('open modal is immediately shown [fade]', async function (assert) {
    await render(hbs`<BsModalSimple @title="Simple Dialog">Hello world!</BsModalSimple>`);

    assert.dom('.modal').hasClass(visibilityClass(), 'Modal is visible');
    assert.dom('.modal').isVisible();
  });

  test('open property shows modal', async function (assert) {
    this.set('open', false);
    await render(
      hbs`<BsModalSimple @title="Simple Dialog" @fade={{false}} @open={{this.open}}>Hello world!</BsModalSimple>`
    );

    assert.dom('.modal').doesNotExist('Modal is hidden');
    this.set('open', true);
    await settled();

    assert.dom('.modal').hasClass(visibilityClass(), 'Modal is visible');
    assert.dom('.modal').isVisible();

    this.set('open', false);
    await settled();

    assert.dom('.modal').doesNotExist('Modal is hidden');
  });

  testRequiringTransitions('open property shows modal [fade]', async function (assert) {
    this.set('open', false);
    await render(hbs`<BsModalSimple @title="Simple Dialog" @open={{this.open}}>Hello world!</BsModalSimple>`);

    assert.dom('.modal').doesNotExist('Modal is hidden');
    this.set('open', true);

    await settled();
    assert.dom('.modal').hasClass(visibilityClass(), 'Modal is visible');
    assert.dom('.modal').isVisible();
    this.set('open', false);

    await settled();
    assert.dom('.modal').doesNotExist('Modal is hidden');
  });

  test('closeButton property shows close button', async function (assert) {
    this.set('closeButton', false);
    await render(
      hbs`<BsModalSimple @title="Simple Dialog" @closeButton={{this.closeButton}}>Hello world!</BsModalSimple>`
    );

    assert.dom('.modal .modal-header .close').doesNotExist('Modal has no close button');
    this.set('closeButton', true);
    assert.dom('.modal .modal-header .close').exists({ count: 1 }, 'Modal has close button');
  });

  test('fade property toggles fade effect', async function (assert) {
    this.set('fade', false);
    await render(hbs`<BsModalSimple @title="Simple Dialog" @fade={{this.fade}}>Hello world!</BsModalSimple>`);
    assert.dom('.modal').hasNoClass('fade', 'Modal has no fade class');
    this.set('fade', true);
    assert.dom('.modal').hasClass('fade', 'Modal has fade class');
  });

  test('backdrop=true adds backdrop element', async function (assert) {
    await render(hbs`<BsModalSimple @title="Simple Dialog" @backdrop={{true}}>Hello world!</BsModalSimple>`);

    assert.dom('.modal-backdrop').exists({ count: 1 }, 'Modal has backdrop element');
    assert.dom('.modal-backdrop').hasClass(visibilityClass(), 'Modal backdrop has visibility class');
  });

  test('backdrop=false removes backdrop element', async function (assert) {
    await render(hbs`<BsModalSimple @title="Simple Dialog" @backdrop={{false}}>Hello world!</BsModalSimple>`);

    assert.dom('.modal-backdrop').doesNotExist('Modal has no backdrop element');
  });

  test('clicking close button closes modal', async function (assert) {
    await render(hbs`<BsModalSimple @title="Simple Dialog">Hello world!</BsModalSimple>`);

    assert.dom('.modal').exists({ count: 1 }, 'Modal is visible');
    assert.dom('.modal').hasClass(visibilityClass(), 'Modal is visible');
    await click('.modal .modal-header .close');

    assert.dom('.modal').doesNotExist('Modal is hidden');
  });

  test('clicking ok button closes modal', async function (assert) {
    await render(hbs`<BsModalSimple @title="Simple Dialog">Hello world!</BsModalSimple>`);

    assert.dom('.modal').exists({ count: 1 }, 'Modal is visible');
    assert.dom('.modal').hasClass(visibilityClass(), 'Modal is visible');
    await click('.modal .modal-footer button');

    assert.dom('.modal').doesNotExist('Modal is hidden');
  });

  test('clicking close button leaves modal open when onHide action returns false', async function (assert) {
    let hideAction = sinon.stub();
    hideAction.returns(false);
    this.actions.hide = hideAction;

    await render(hbs`<BsModalSimple @title="Simple Dialog" @onHide={{action "hide"}}>Hello world!</BsModalSimple>`);

    // wait for fade animation
    assert.dom('.modal').exists({ count: 1 }, 'Modal is visible');
    assert.dom('.modal').hasClass(visibilityClass(), 'Modal is visible');
    await click('.modal .modal-header .close');

    assert.dom('.modal').hasClass(visibilityClass(), 'Modal is still visible');
  });

  test('can implement custom close buttons', async function (assert) {
    await render(hbs`
      <BsModalSimple @title="Simple Dialog" as |modal|>
        Hello world! <a href="#" class="close-link" onclick={{modal.close}}>close</a>
      </BsModalSimple>
    `);

    assert.dom('.modal').exists({ count: 1 }, 'Modal is visible');
    assert.dom('.modal').hasClass(visibilityClass(), 'Modal is visible');
    await click('.modal .close-link');

    assert.dom('.modal').doesNotExist('Modal is hidden');
  });

  test('size property adds size class', async function (assert) {
    await render(hbs`<BsModalSimple @title="Simple Dialog" @size="lg" @fade={{false}}>Hello world!</BsModalSimple>`);
    assert.dom('.modal-dialog').hasClass('modal-lg', 'Modal has size class.');
  });

  test('onShow/onShown actions fire correctly with fade=false', async function (assert) {
    this.set('open', false);
    let showSpy = sinon.spy();
    let shownSpy = sinon.spy();
    this.actions.openAction = showSpy;
    this.actions.openedAction = shownSpy;
    await render(
      hbs`<BsModalSimple @title="Simple Dialog" @onShow={{action "openAction"}} @onShown={{action "openedAction"}} @open={{this.open}} @fade={{false}}>Hello world!</BsModalSimple>`
    );

    this.set('open', true);
    await settled();

    assert.ok(showSpy.calledOnce, 'onShow action fired after setting open=true');
    assert.ok(shownSpy.calledOnce, 'onShown action fired after setting open=true');
  });

  testRequiringTransitions('onShow/onShown fire correctly with fade=true', async function (assert) {
    this.set('open', false);
    let showSpy = sinon.spy();
    let shownSpy = sinon.spy();
    this.actions.openAction = showSpy;
    this.actions.openedAction = shownSpy;
    await render(
      hbs`<BsModalSimple @title="Simple Dialog" @onShow={{action "openAction"}} @onShown={{action "openedAction"}} @open={{this.open}}>Hello world!</BsModalSimple>`
    );

    this.set('open', true);
    assert.notOk(showSpy.called, 'onShow action did not fire immediately');
    assert.notOk(shownSpy.called, 'onShown action did not fire immediately');

    // wait for fade animation
    await settled();
    assert.ok(showSpy.calledOnce, 'onShow action did fire');
    assert.ok(shownSpy.calledOnce, 'onShown action did fire');
  });

  test('onHide is called when clicking close button', async function (assert) {
    let hideSpy = sinon.spy();
    this.actions.testAction = hideSpy;
    await render(
      hbs`<BsModalSimple @title="Simple Dialog" @fade={{false}} @onHide={{action "testAction"}}>Hello world!</BsModalSimple>`
    );
    await click('.modal .modal-header .close');
    assert.ok(hideSpy.calledOnce);
  });

  test('onHidden is called after modal is closed', async function (assert) {
    this.set('open', true);
    let hiddenSpy = sinon.spy();
    this.actions.testAction = hiddenSpy;
    await render(
      hbs`<BsModalSimple @title="Simple Dialog" @onHidden={{action "testAction"}} @open={{this.open}}>Hello world!</BsModalSimple>`
    );

    this.set('open', false);
    // wait for fade animation
    await settled();
    assert.ok(hiddenSpy.calledOnce);
  });

  test('onSubmit is called when clicking submit button', async function (assert) {
    let submitSpy = sinon.spy();
    this.actions.testAction = submitSpy;
    await render(
      hbs`<BsModalSimple @title="Simple Dialog" @closeTitle="Cancel" @submitTitle="Ok" @onSubmit={{action "testAction"}}>Hello world!</BsModalSimple>`
    );
    await click('.modal .modal-footer button.btn-primary');
    assert.ok(submitSpy.calledOnce);
  });

  test('when modal has a form and the submit button is clicked, the form is submitted', async function (assert) {
    let modalSpy = sinon.spy();
    let formSpy = sinon.spy();
    this.actions.modalSubmit = modalSpy;
    this.actions.formSubmit = formSpy;
    await render(
      hbs`<BsModalSimple @title="Simple Dialog" @closeTitle="Cancel" @submitTitle="Ok" @onSubmit={{action "modalSubmit"}}><BsForm @onSubmit={{action "formSubmit"}}></BsForm></BsModalSimple>`
    );
    await click('.modal .modal-footer button.btn-primary');
    assert.ok(formSpy.calledOnce);
    assert.notOk(modalSpy.called);
  });

  test('when modal has several forms and the submit button is clicked, those forms are submitted', async function (assert) {
    let modalSpy = sinon.spy();
    let formOneSpy = sinon.spy();
    let formTwoSpy = sinon.spy();
    this.actions.modalSubmit = modalSpy;
    this.actions.formOneSubmit = formOneSpy;
    this.actions.formTwoSubmit = formTwoSpy;
    await render(
      hbs`<BsModalSimple @title="Simple Dialog" @closeTitle="Cancel" @submitTitle="Ok" @onSubmit={{action "modalSubmit"}}><BsForm @onSubmit={{action "formOneSubmit"}}></BsForm><BsForm @onSubmit={{action "formTwoSubmit"}}></BsForm></BsModalSimple>`
    );
    await click('.modal .modal-footer button.btn-primary');
    assert.ok(formOneSpy.calledOnce);
    assert.ok(formTwoSpy.calledOnce);
    assert.notOk(modalSpy.called);
  });

  testRequiringFocus('autofocus element is focused when present and fade=false', async function (assert) {
    this.set('open', false);
    await render(hbs`
      <BsModalSimple @title="Simple Dialog" @fade={{false}} @open={{this.open}}>
        <input data-test-autofocus autofocus="autofocus">
      </BsModalSimple>
    `);

    this.set('open', true);
    await settled();
    assert.dom('input[data-test-autofocus]').isFocused();
  });

  testRequiringFocus('modal is focused when open', async function (assert) {
    await render(hbs`
      <BsModalSimple @title="Simple Dialog" @fade={{false}} @open={{true}}>
        Hallo
      </BsModalSimple>
    `);

    assert.dom('.modal-content').isFocused();
  });

  testRequiringFocus('modal is focused when opened later', async function (assert) {
    this.set('open', false);
    await render(hbs`
      <BsModalSimple @title="Simple Dialog" @fade={{false}} @open={{this.open}}>
        Hallo
      </BsModalSimple>
    `);

    this.set('open', true);
    await settled();

    assert.dom('.modal-content').isFocused();
  });

  // unfortunately it seems we cannot simulate the user moving focus by tabbing by triggering key events :(
  // keeping this around in case a working solution pops up...
  skip('focus is trapped in modal', async function (assert) {
    await render(hbs`
      <BsModalSimple @title="Simple Dialog" @fade={{false}}>
        <input data-test-input>
        <a href="#" data-test-link>Link</a>
      </BsModalSimple>
    `);

    await triggerKeyEvent(document, 'keyup', 9); // tab
    assert.dom('.close').isFocused();

    await triggerKeyEvent(document, 'keyup', 9); // tab
    assert.dom('[data-test-input]').isFocused(); // input

    await triggerKeyEvent(document, 'keyup', 9); // tab
    assert.dom('[data-test-link]').isFocused(); // link

    await triggerKeyEvent(document, 'keyup', 9); // tab
    assert.dom('.btn').isFocused(); // default submit button

    await triggerKeyEvent(document, 'keyup', 9); // tab
    assert.dom('.close').isFocused(); // cycle to close button
  });

  testRequiringFocus('focus is reset to previously focused element', async function (assert) {
    this.set('open', false);
    await render(hbs`
      <button type="button" data-test-button>Open</button>
      <BsModalSimple @title="Simple Dialog" @fade={{false}} @open={{this.open}}>
        Hallo
      </BsModalSimple>
    `);
    await focus('[data-test-button]');

    this.set('open', true);
    await settled();

    this.set('open', false);
    await settled();

    assert.dom('[data-test-button]').isFocused();
  });

  testRequiringFocus('Pressing escape key will close the modal if keyboard=true', async function (assert) {
    let action = sinon.spy();
    this.actions.testAction = action;
    await render(
      hbs`<BsModalSimple @title="Simple Dialog" @onHide={{action "testAction"}} @keyboard={{true}}>Hello world!</BsModalSimple>`
    );

    // wait for fade animation
    await waitUntil(() => this.element.querySelector('.modal').classList.contains(visibilityClass()));

    // trigger escape key event
    await triggerKeyEvent('.modal', 'keydown', 27);

    // wait for fade animation
    await waitUntil(() => !this.element.querySelector('.modal'));

    assert.ok(action.calledOnce, 'Action has been called.');
  });

  testRequiringFocus(
    'Pressing escape key will close the modal if keyboard=true and element is autofocused',
    async function (assert) {
      let action = sinon.spy();
      this.actions.testAction = action;
      await render(hbs`
      <BsModalSimple @title="Simple Dialog" @onHide={{action "testAction"}} @keyboard={{true}}>
        <input autofocus="autofocus">
      </BsModalSimple>

    `);

      // wait for fade animation
      await waitUntil(() => this.element.querySelector('.modal').classList.contains(visibilityClass()));

      // trigger escape key event
      await triggerKeyEvent('.modal', 'keydown', 27);

      // wait for fade animation
      await waitUntil(() => !this.element.querySelector('.modal'));

      assert.ok(action.calledOnce, 'Action has been called.');
    }
  );

  testRequiringFocus('Pressing escape key is ignored if keyboard=false', async function (assert) {
    let hideSpy = sinon.spy();
    this.actions.testAction = hideSpy;
    await render(
      hbs`<BsModalSimple @title="Simple Dialog" @onHide={{action "testAction"}} @keyboard={{false}}>Hello world!</BsModalSimple>`
    );

    // wait for fade animation
    await waitUntil(() => this.element.querySelector('.modal').classList.contains(visibilityClass()));

    // trigger escape key event
    await triggerKeyEvent('.modal', 'keydown', 27);

    assert.notOk(hideSpy.called);
  });

  test('Clicking on the backdrop will close the modal', async function (assert) {
    let hideSpy = sinon.spy();
    this.actions.testAction = hideSpy;
    await render(
      hbs`<BsModalSimple @title="Simple Dialog" @onHide={{action "testAction"}}>Hello world!</BsModalSimple>`
    );

    // wait for fade animation
    await waitUntil(() => this.element.querySelector('.modal').classList.contains(visibilityClass()));

    await click('.modal');

    // wait for fade animation
    await waitUntil(() => !this.element.querySelector('.modal'));
    assert.ok(hideSpy.calledOnce);
  });

  test('Clicking on the backdrop is ignored when backdropClose=false', async function (assert) {
    let hideSpy = sinon.spy();
    this.actions.testAction = hideSpy;
    await render(
      hbs`<BsModalSimple @title="Simple Dialog" @onHide={{action "testAction"}} @backdropClose={{false}}>Hello world!</BsModalSimple>`
    );
    // wait for fade animation
    await waitUntil(() => this.element.querySelector('.modal').classList.contains(visibilityClass()));
    await click('.modal');

    assert.dom('.modal').hasClass(visibilityClass(), 'Modal is still visible');
    assert.notOk(hideSpy.called);
  });

  test("Renders in wormhole's default destination if renderInPlace is not set", async function (assert) {
    this.set('show', false);
    await render(
      hbs`<div id="ember-bootstrap-wormhole"></div>{{#if this.show}}<BsModalSimple @title="Simple Dialog">Hello world!</BsModalSimple>{{/if}}`
    );
    this.set('show', true);
    await settled();

    assert.dom('.modal').exists({ count: 1 }, 'Modal exists.');
    assert.dom('#ember-bootstrap-wormhole .modal').exists({ count: 1 }, 'Modal exists in wormhole');
  });

  test('Renders in test container if renderInPlace is not set', async function (assert) {
    this.set('show', false);
    await render(
      hbs`<div id="wrapper">{{#if this.show}}<BsModalSimple @title="Simple Dialog">Hello world!</BsModalSimple>{{/if}}</div>`
    );
    this.set('show', true);
    await settled();

    assert.dom('.modal').exists({ count: 1 }, 'Modal exists.');
    assert.dom('#wrapper .modal').doesNotExist();
  });

  test('Renders in place (no wormhole) if renderInPlace is set', async function (assert) {
    this.set('show', false);
    await render(
      hbs`<div id="ember-bootstrap-wormhole"></div><div id="wrapper">{{#if this.show}}<BsModalSimple @title="Simple Dialog" @renderInPlace={{true}}>Hello world!</BsModalSimple>{{/if}}</div>`
    );
    this.set('show', true);
    await settled();

    assert.dom('#wrapper .modal').exists({ count: 1 }, 'Modal exists in place');
  });

  test('Removes "modal-open" class when component is removed from view', async function (assert) {
    this.set('renderComponent', true);
    await render(
      hbs`{{#if this.renderComponent}}<BsModalSimple @title="Simple Dialog">Hello world!</BsModalSimple>{{/if}}`
    );

    // wait for fade animation
    await waitUntil(() => this.element.querySelector('.modal').classList.contains(visibilityClass()));
    assert.dom(document.body).hasClass('modal-open', 'body element has "modal-open" class.');

    this.set('renderComponent', false);

    assert.ok(!document.body.classList.contains('modal-open'), 'body element does not have "modal-open" class.');
  });

  test('Resets scroll bar when component is removed from view', async function (assert) {
    document.body.style.paddingRight = '50px';
    this.set('renderComponent', true);
    await render(
      hbs`{{#if this.renderComponent}}<BsModalSimple @title="Simple Dialog">Hello world!</BsModalSimple>{{/if}}`
    );

    await waitUntil(() => this.element.querySelector('.modal').classList.contains(visibilityClass()));

    document.body.style.paddingRight = '0px';
    this.set('renderComponent', false);

    assert.equal(document.body.style.paddingRight, '50px', 'paddingRight restored to 50px');
    document.body.style.paddingRight = '0px';
  });

  test('Modal yields close action', async function (assert) {
    let closeAction = sinon.spy();
    this.actions.close = closeAction;

    await render(hbs`
      <BsModalSimple @onHide={{action "close"}} as |modal|>
        <button type="button" id="close" {{action modal.close}}>Close</button>
      </BsModalSimple>
    `);

    await click('#close');
    assert.ok(closeAction.calledOnce, 'close action has been called.');
  });

  test('Modal yields submit action', async function (assert) {
    let submitAction = sinon.spy();
    this.actions.submit = submitAction;

    await render(hbs`
      <BsModalSimple @onSubmit={{action "submit"}} as |modal|>
        <button type="button" id="submit" {{action modal.submit}}>Submit</button>
      </BsModalSimple>
    `);

    await click('#submit');
    assert.ok(submitAction.calledOnce, 'submit action has been called.');
  });

  test('closing modal does not modify public open property', async function (assert) {
    this.set('open', true);
    await render(
      hbs`<BsModalSimple @title="Simple Dialog" @fade={{false}} @open={{this.open}}>Hello world!</BsModalSimple>`
    );
    await click('.modal .modal-header .close');
    assert.equal(this.open, true, 'DOes not change open property');
  });

  testNotBS3('modal can be centered vertically', async function (assert) {
    await render(
      hbs`<BsModalSimple @title="Simple Dialog" @fade={{false}} @position="center">Hello world!</BsModalSimple>`
    );
    assert.dom('.modal-dialog').hasClass('modal-dialog-centered');
  });

  test('Modal has accesibility attributes with default title', async function (assert) {
    await render(hbs`<BsModalSimple @open={{true}} @title="Simple Dialog">Hello world!</BsModalSimple>`);

    const modalTitleId = document.getElementsByClassName('modal-title')[0].id;
    assert.dom('.modal').exists({ count: 1 }, 'Modal exists.');
    assert.dom('.modal').hasAttribute('role', 'dialog');
    assert.dom('.modal-dialog').hasAttribute('role', 'document');
    assert.dom('.modal').hasAttribute('aria-labelledby', modalTitleId);
  });

  test('it passes along HTML attributes', async function (assert) {
    await render(hbs`
      <BsModalSimple @fade={{false}} class="custom" role="alert" data-test>
        template block text
      </BsModalSimple>
    `);

    assert.dom('.modal').exists({ count: 1 });
    assert.dom('.modal').hasClass('custom');
    assert.dom('.modal').hasAttribute('role', 'alert');
    assert.dom('.modal').hasAttribute('data-test');
  });

  testNotBS3('modal can be set to scrollable', async function (assert) {
    await render(
      hbs`<BsModalSimple @title="Simple Dialog" @fade={{false}} @scrollable={{true}}>Hello world!</BsModalSimple>`
    );
    assert.dom('.modal-dialog').hasClass('modal-dialog-scrollable');
  });

  test('it passes accessibility checks', async function (assert) {
    await render(hbs`
      <BsModalSimple @title="Some Title">
        template block text
      </BsModalSimple>
    `);

    await a11yAudit();
    assert.ok(true, 'A11y audit passed');
  });
});
