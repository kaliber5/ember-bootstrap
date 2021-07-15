import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { warn } from '@ember/debug';
import Component from '@glimmer/component';
import arg from 'ember-bootstrap/utils/decorators/arg';
import deprecateSubclassing from 'ember-bootstrap/utils/deprecate-subclassing';
import { DEBUG } from '@glimmer/env';

/**
  Implements a HTML button element, with support for all [Bootstrap button CSS styles](http://getbootstrap.com/css/#buttons)
  as well as advanced functionality such as button states.

  ### Basic Usage

  ```hbs
  <BsButton @type="primary" @icon="glyphicon glyphicon-download">
    Downloads
  </BsButton>
  ```

  ### Actions

  Use the `onClick` property of the component to send an action to your controller. It will receive the button's value
  (see the `value` property) as an argument.

  ```hbs
  <BsButton @type="primary" @icon="glyphicon glyphicon-download" @onClick=(action "download")>
    Downloads
  </BsButton>
  ```

  ### Promise support for automatic state change

  When returning a Promise for any asynchronous operation from the `onClick` closure action the button will
  manage an internal state ("default" > "pending" > "fulfilled"/"rejected") automatically.

  The button is disabled by default if it's in pending state. You could override this behavior by passing
  the `disabled` HTML attribute or by setting `@preventConcurrency` to false.

  ```hbs
  <BsButton
    disabled={{false}}
  />
  ```

  ```hbs
  <BsButton
    @preventConcurrency={{false}}
  />
  ```

  The label could be changed automatically according to the state of the promise with `@defaultText`,
  `@pendingText`, `@fulfilledText` and `@rejectedText` arguments:

  ```hbs
  <BsButton
    @type="primary"
    @icon="glyphicon glyphicon-download"
    @defaultText="Download"
    @pendingText="Loading..."
    @fulfilledText="Completed!"
    @rejectedText="Oups!?"
    @onClick={{this.download}}
  />
  ```

  ```js
  // controller.js
  import { Controller } from '@ember/controller';
  import { action } from '@ember/object';

  export default class MyController extends Controller {
    @action
    download(value) {
      return new Promise(...);
    }
  });
  ```

  For further customization `isPending`, `isFulfilled`, `isRejected` and `isSettled` properties are yielded:

  ```hbs
  <BsButton @onClick=(action "download") as |button|>
    Download
    {{#if button.isPending}}
      <span class="loading-spinner"></span>
    {{/if}}
  </BsButton>
  ```

  You can `reset` the state represented by these properties and used for button's text by setting `reset` property to
  `true`.

  *Note that only invoking the component in a template as shown above is considered part of its public API. Extending from it (subclassing) is generally not supported, and may break at any time.*

  @class Button
  @namespace Components
  @extends Glimmer.Component
  @public
*/
@deprecateSubclassing
export default class Button extends Component {
  /**
   * Default label of the button. Not need if used as a block component
   *
   * @property defaultText
   * @type string
   * @public
   */

  /**
   * Label of the button used if `onClick` event has returned a Promise which is pending.
   * Not considered if used as a block component.
   *
   * @property pendingText
   * @type string
   * @public
   */

  /**
   * Label of the button used if `onClick` event has returned a Promise which succeeded.
   * Not considered if used as a block component.
   *
   * @property fulfilledText
   * @type string
   * @public
   */

  /**
   * Label of the button used if `onClick` event has returned a Promise which failed.
   * Not considered if used as a block component.
   *
   * @property rejectedText
   * @type string
   * @public
   */

  /**
   * Property to disable the button only used in internal communication
   * between Ember Boostrap components.
   *
   * @property _disabled
   * @type ?boolean
   * @default null
   * @private
   */

  get __disabled() {
    if (this.args._disabled !== undefined) {
      return this.args._disabled;
    }

    return this.isPending && this.args.preventConcurrency !== false;
  }

  /**
   * Set the type of the button, either 'button' or 'submit'
   *
   * @property buttonType
   * @type String
   * @default 'button'
   * @deprecated
   * @public
   */
  @arg buttonType = 'button';

  /**
   * Set the 'active' class to apply active/pressed CSS styling
   *
   * @property active
   * @type boolean
   * @default false
   * @public
   */

  /**
   * Property for block level buttons
   *
   * See the [Bootstrap docs](http://getbootstrap.com/css/#buttons-sizes)
   * @property block
   * @type boolean
   * @default false
   * @public
   */
  @arg block = false;

  /**
   * A click event on a button will not bubble up the DOM tree if it has an `onClick` action handler. Set to true to
   * enable the event to bubble
   *
   * @property bubble
   * @type boolean
   * @default false
   * @public
   */

  /**
   * If button is active and this is set, the icon property will match this property
   *
   * @property iconActive
   * @type String
   * @public
   */

  /**
   * If button is inactive and this is set, the icon property will match this property
   *
   * @property iconInactive
   * @type String
   * @public
   */

  /**
   * Class(es) (e.g. glyphicons or font awesome) to use as a button icon
   * This will render a <i class="{{icon}}"></i> element in front of the button's label
   *
   * @property icon
   * @type String
   * @public
   */
  get icon() {
    return this.args.icon || (this.args.active ? this.args.iconActive : this.args.iconInactive);
  }

  /**
   * Supply a value that will be associated with this button. This will be send
   * as a parameter of the default action triggered when clicking the button
   *
   * @property value
   * @type any
   * @public
   */

  /**
   * Controls if `onClick` action is fired concurrently. If `true` clicking button multiple times will not trigger
   * `onClick` action if a Promise returned by previous click is not settled yet.
   *
   * This does not affect event bubbling.
   *
   * @property preventConcurrency
   * @type Boolean
   * @default true
   * @public
   */

  /**
   * State of the button. The button's label (if not used as a block component) will be set to the
   * `<state>Text` property.
   * This property will automatically be set when using a click action that supplies the callback with a promise.
   * Possible values are: "default" > "pending" > "fulfilled" / "rejected".
   * It could be reseted by `reset` property.
   *
   * @property state
   * @type String
   * @default 'default'
   * @private
   */
  @tracked _state = 'default';
  get state() {
    return this.args.state ?? this._state;
  }
  set state(state) {
    this._state = state;
  }

  /**
   * Promise returned by `onClick` event is pending.
   *
   * @property isPending
   * @type Boolean
   * @private
   */
  get isPending() {
    return this.state === 'pending';
  }

  /**
   * Promise returned by `onClick` event has been succeeded.
   *
   * @property isFulfilled
   * @type Boolean
   * @private
   */
  get isFulfilled() {
    return this.state === 'fulfilled';
  }

  /**
   * Promise returned by `onClick` event has been rejected.
   *
   * @property isRejected
   * @type Boolean
   * @private
   */
  get isRejected() {
    return this.state === 'rejected';
  }

  /**
   * Promise returned by `onClick` event has been succeeded or rejected.
   *
   * @property isSettled
   * @type Boolean
   * @private
   */
  get isSettled() {
    return this.isFulfilled || this.isRejected;
  }

  /**
   * Set this to `true` to reset the `state`. A typical use case is to bind this attribute with ember-data isDirty flag.
   *
   * The old value is not taken into consideration. Setting a `true` value to `true` again will also reset `state`.
   * In that case it's even to notify the observer system that the property has changed by calling
   * [`notifyPropertyChange()`](https://www.emberjs.com/api/ember/3.2/classes/EmberObject/methods/notifyPropertyChange?anchor=notifyPropertyChange).
   *
   * @property reset
   * @type boolean
   * @public
   */

  /**
   * Property for size styling, set to 'lg', 'sm' or 'xs'
   *
   * Also see the [Bootstrap docs](https://getbootstrap.com/docs/4.3/components/buttons/#sizes)
   *
   * @property size
   * @type String
   * @public
   */

  /**
   * Property for type styling
   *
   * For the available types see the [Bootstrap docs](https://getbootstrap.com/docs/4.3/components/buttons/)
   *
   * @property type
   * @type String
   * @default 'secondary'
   * @public
   */

  /**
   * Property to create outline buttons (BS4+ only)
   *
   * @property outline
   * @type boolean
   * @default false
   * @public
   */

  /**
   * When clicking the button this action is called with the value of the button (that is the value of the "value" property).
   *
   * Return a promise object, and the buttons state will automatically set to "pending", "resolved" and/or "rejected".
   * This could be used to automatically set the button's text depending on promise state (`defaultText`, `pendingText`,
   * `fulfilledText`, `rejectedText`) and for futher customization using the yielded `isPending`, `isFulfilled`,
   * `isRejected` properties.
   *
   * The click event will not bubble up, unless you set `bubble` to true.
   *
   * @event onClick
   * @param {*} value
   * @public
   */

  /**
   * This will reset the state property to 'default', and with that the button's label to defaultText
   *
   * @method resetState
   * @private
   */
  @action
  resetState() {
    this.state = 'default';
  }

  get text() {
    return this.args[`${this.state}Text`] || this.args.defaultText;
  }

  /**
   * @method click
   * @private
   */
  @action
  async handleClick(e) {
    const { bubble, onClick, preventConcurrency } = this.args;

    if (typeof onClick !== 'function') {
      return;
    }

    // Shouldn't we prevent propagation regardless if `@onClick` is a function?
    if (!bubble) {
      e.stopPropagation();
    }

    if (preventConcurrency && this.isPending) {
      return;
    }

    this.state = 'pending';

    try {
      await onClick(this.args.value);

      if (!this.isDestroyed) {
        this.state = 'fulfilled';
      }
    } catch (error) {
      if (!this.isDestroyed) {
        this.state = 'rejected';
      }

      throw error;
    }
  }

  constructor() {
    super(...arguments);

    // deprecate arguments used for attribute bindings only
    if (DEBUG) {
      [
        // ['buttonType:type', 'submit'],
        ['disabled', true],
        ['title', 'foo'],
      ].forEach(([mapping, value]) => {
        let argument = mapping.split(':')[0];
        let attribute = mapping.includes(':') ? mapping.split(':')[1] : argument;
        let warningMessage =
          `Argument ${argument} of <BsButton> component has been removed. Its only purpose ` +
          `was setting the HTML attribute ${attribute} of the control element. You should use ` +
          `angle bracket component invocation syntax instead:\n` +
          `Before:\n` +
          `  {{bs-button ${attribute}=${typeof value === 'string' ? `"${value}"` : value}}}\n` +
          `  <BsButton @${attribute}=${typeof value === 'string' ? `"${value}"` : `{{${value}}}`} />\n` +
          `After:\n` +
          `  <BsButton ${typeof value === 'boolean' ? attribute : `${attribute}="${value}"`} />\n` +
          `A codemod is available to help withFi the required migration. See https://github.com/kaliber5/ember-bootstrap-codemods/blob/master/transforms/deprecated-attribute-arguments/README.md`;

        warn(warningMessage, !Object.keys(this.args).includes(argument), {
          id: `ember-bootstrap.removed-argument.button#${argument}`,
        });
      });
    }
  }
}
