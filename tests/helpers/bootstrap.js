import config from 'dummy/config/environment';
import { skip, test } from 'qunit';
import { Promise } from 'rsvp';

const currentBootstrapVersion = parseInt(config.bootstrapVersion);

export function testForBootstrap(bsVersion, name, fn) {
  if (!Array.isArray(bsVersion)) {
    bsVersion = [bsVersion];
  }
  if (!bsVersion.includes(currentBootstrapVersion)) {
    // Skip test for different Bootstrap version
    return;
  }
  return test(`${name} [BS${bsVersion}]`, fn);
}

export function isBootstrap(version) {
  return currentBootstrapVersion === version;
}

export function testBS3() {
  return testForBootstrap(3, ...arguments);
}

export function testBS4() {
  return testForBootstrap(4, ...arguments);
}

export function testBS5() {
  return testForBootstrap(5, ...arguments);
}

export function testNotBS3() {
  return testForBootstrap([4, 5], ...arguments);
}

export function versionDependent(v3, v4, v5) {
  if (isBootstrap(3)) {
    return v3;
  }

  if (isBootstrap(5)) {
    return v5 ?? v4;
  }

  return v4;
}

export function visibilityClass() {
  return versionDependent('in', 'show');
}

export function openClass() {
  return versionDependent('open', 'show');
}

export function defaultButtonClass() {
  return versionDependent('btn-default', 'btn-secondary');
}

export function formFeedbackClass() {
  return versionDependent('help-block', 'invalid-feedback');
}

export function formFeedbackElement() {
  return versionDependent('.form-group', '.form-control');
}

export function validationSuccessClass() {
  return versionDependent('has-success', 'is-valid');
}

export function validationErrorClass() {
  return versionDependent('has-error', 'is-invalid');
}

export function validationWarningClass() {
  return versionDependent('has-warning', 'is-warning');
}

export function placementClassFor(type, placement) {
  return versionDependent(placement, `${type}-${placement}`);
}

export function positionClassFor(position) {
  return versionDependent(`navbar-${position}`, position);
}

export function positionStickyClass() {
  return versionDependent('navbar-static-top', 'sticky-top');
}

export function formHelpTextClass() {
  return versionDependent('help-block', 'form-text');
}

export function accordionClass() {
  return versionDependent('panel-group', 'accordion', 'accordion');
}

export function accordionItemClass() {
  return versionDependent('panel', 'card', 'accordion-item');
}

export function accordionClassFor(type) {
  type = type ? `-${type}` : '';
  return versionDependent(`panel${type}`, type ? `bg${type}` : 'card');
}

export function accordionTitleSelector() {
  return versionDependent('.panel-title', 'h5', 'h2.accordion-header');
}

export function accordionItemHeadClass() {
  return versionDependent('panel-heading', 'card-header', 'accordion-header');
}

export function accordionItemClickableSelector() {
  return versionDependent('.panel-title a', 'h5 button', '.accordion-header button');
}

export function dropdownVisibilityElementSelector() {
  return versionDependent('.dropdown', '.dropdown-menu');
}

export function accordionItemBodyClass() {
  return versionDependent('panel-body', 'card-body', 'accordion-body');
}

export function tooltipPositionClass(pos) {
  return versionDependent(pos, `bs-tooltip-${pos}`);
}

export function popoverPositionClass(pos) {
  return versionDependent(pos, `bs-popover-${pos}`);
}

export function tooltipArrowClass() {
  return versionDependent('tooltip-arrow', 'arrow', 'tooltip-arrow');
}

export function popoverArrowClass() {
  return versionDependent('arrow', 'arrow', 'popover-arrow');
}

export function visuallyHiddenClass() {
  return versionDependent('sr-only', 'sr-only', 'visually-hidden');
}

export function isVisible(el) {
  return !isHidden(el);
}

export function isHidden(el) {
  // A bit of an odd test, but taken from https://stackoverflow.com/questions/19669786/check-if-element-is-visible-in-dom
  // referencing https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
  return !el || el.offsetParent === null;
}

export { test };

export function testRequiringFocus(name, fn) {
  if (document.hasFocus()) {
    return test(name, fn);
  } else {
    skip(name);
  }
}

export function testBS3RequiringFocus(name, fn) {
  if (document.hasFocus()) {
    return testBS3(name, fn);
  } else {
    skip(name);
  }
}

export function testBS4RequiringFocus(name, fn) {
  if (document.hasFocus()) {
    return testBS4(name, fn);
  } else {
    skip(name);
  }
}

export function testBS5RequiringFocus(name, fn) {
  if (document.hasFocus()) {
    return testBS5(name, fn);
  } else {
    skip(name);
  }
}

export function testNotBS3RequiringFocus(name, fn) {
  if (document.hasFocus()) {
    return testNotBS3(name, fn);
  } else {
    skip(name);
  }
}

export function testRequiringTransitions(name, fn) {
  return test(name, fn);
}

export function delay(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}
