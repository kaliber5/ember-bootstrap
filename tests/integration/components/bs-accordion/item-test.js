import { module } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import {
  accordionClassFor,
  accordionItemBodyClass,
  accordionItemHeadClass,
  accordionTitleSelector,
  accordionItemClickableSelector,
  test,
  visibilityClass,
  accordionItemClass,
} from '../../../helpers/bootstrap';
import setupNoDeprecations from '../../../helpers/setup-no-deprecations';
import sinon from 'sinon';

module('Integration | Component | bs-accordion-item', function (hooks) {
  setupRenderingTest(hooks);
  setupNoDeprecations(hooks);

  hooks.beforeEach(function () {
    this.actions = {};
    this.send = (actionName, ...args) => this.actions[actionName].apply(this, args);
  });

  test('accordion item has correct default markup', async function (assert) {
    await render(hbs`<BsAccordion::Item @title="TITLE">CONTENT</BsAccordion::Item>`);
    assert.dom(`.${accordionItemClass()}`).exists(`has ${accordionItemClass()} class`);
    assert
      .dom(`.${accordionItemClass()}`)
      .hasClass(accordionClassFor('default'), `has ${accordionClassFor('default')} class`);
    assert.dom(`.${accordionItemClass()} .${accordionItemHeadClass()}`).exists();
    assert.dom(accordionItemClickableSelector()).hasClass('collapsed', `has collapsed class`);
    assert.dom('.collapse').exists();
    assert.dom('.collapse').hasNoClass(visibilityClass(), '.collapse is hidden');
    assert.dom(accordionTitleSelector()).hasText('TITLE', `${accordionTitleSelector()} has correct title`);
    assert.dom(`.${accordionItemBodyClass()}`).hasText('CONTENT', `${accordionItemBodyClass()} has correct title`);
  });

  test('calls onClick action when clicking heading', async function (assert) {
    let action = sinon.spy();
    this.actions.click = action;
    await render(
      hbs`<BsAccordion::Item @value={{1}} @onClick={{action "click"}} @title="TITLE">CONTENT</BsAccordion::Item>`
    );

    await click(accordionItemClickableSelector());
    assert.ok(action.calledWith(1), 'onClick action has been called.');
  });

  test('renders a contextual title block', async function (assert) {
    await render(hbs`
      <BsAccordion::Item as |aitem|>
        <aitem.title>TITLE</aitem.title>
        <aitem.body>CONTENT</aitem.body>
      </BsAccordion::Item>
    `);

    assert.dom(accordionTitleSelector()).hasText('TITLE', `${accordionClassFor('title')} has correct title`);
    assert.dom(`.${accordionItemBodyClass()}`).hasText('CONTENT', `${accordionItemBodyClass()} has correct content`);
  });

  test('accordion items can be disabled', async function (assert) {
    let action = sinon.spy();
    this.actions.click = action;
    await render(
      hbs`<BsAccordion::Item @value={{1}} @disabled={{true}} @onClick={{action "click"}} @title="TITLE">CONTENT</BsAccordion::Item>`
    );
    assert
      .dom(accordionItemClickableSelector())
      .hasClass('disabled', 'Clickable accordion selector has `.disabled` class')
      .hasAttribute('disabled');
    assert.dom(`.${accordionItemClass()}`).hasClass('disabled', 'entire item has `.disabled` class');
    try {
      await click(accordionItemClickableSelector());
    } catch (e) {
      // click helper will throw on a disabled button
    }
    assert.notOk(action.calledWith(1), 'onClick action should not be called');
  });
});
