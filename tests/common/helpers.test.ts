import { assert } from 'sinon';
import helpers from 'common/helpers';

describe('Polish Numerals', () => {
    it('should use correct form for each given numeral', function () {
        const forms = ['punkt', 'punkty', 'punktów'];
        assert.match(helpers.numeral(1, ...forms), 'punkt');
        assert.match(helpers.numeral(2, ...forms), 'punkty');
        assert.match(helpers.numeral(3, ...forms), 'punkty');
        assert.match(helpers.numeral(4, ...forms), 'punkty');
        assert.match(helpers.numeral(5, ...forms), 'punktów');
        assert.match(helpers.numeral(6, ...forms), 'punktów');
        assert.match(helpers.numeral(9, ...forms), 'punktów');
        assert.match(helpers.numeral(22, ...forms), 'punkty');
        assert.match(helpers.numeral(23, ...forms), 'punkty');
        assert.match(helpers.numeral(24, ...forms), 'punkty');
        assert.match(helpers.numeral(25, ...forms), 'punktów');
        assert.match(helpers.numeral(39, ...forms), 'punktów');
        assert.match(helpers.numeral(66, ...forms), 'punktów');
        assert.match(helpers.numeral(101, ...forms), 'punktów');
        assert.match(helpers.numeral(102, ...forms), 'punkty');
        assert.match(helpers.numeral(1253, ...forms), 'punkty');
    });

    it('should use form for each given numeral, having it use second when no third given', function () {
        const forms = ['punktu', 'punktów'];
        assert.match(helpers.numeral(1, ...forms), 'punktu');
        assert.match(helpers.numeral(2, ...forms), 'punktów');
        assert.match(helpers.numeral(3, ...forms), 'punktów');
        assert.match(helpers.numeral(4, ...forms), 'punktów');
        assert.match(helpers.numeral(5, ...forms), 'punktów');
        assert.match(helpers.numeral(6, ...forms), 'punktów');
        assert.match(helpers.numeral(9, ...forms), 'punktów');
        assert.match(helpers.numeral(25, ...forms), 'punktów');
        assert.match(helpers.numeral(39, ...forms), 'punktów');
        assert.match(helpers.numeral(66, ...forms), 'punktów');
        assert.match(helpers.numeral(101, ...forms), 'punktów');
    });
});
