import React from 'react';
import renderer from 'react-test-renderer';
import { shallow } from 'enzyme';
import { Button } from './Button';

test('Button is truthy', () => {
	const component = renderer.create(<Button label="Button" />);

	expect(component).toBeTruthy();
});
