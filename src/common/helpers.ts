export default {
    times: (n: Number, block: { fn: Function }) => { // TODO: @pchecinski maybe we should use array function like "map" here instead
        let accum = '';
        for (let i = 1; i <= n; i++) {
            accum += block.fn(i);
        }
        return accum;
    },

    check: (x: Number, y: Number, block: { fn: Function, inverse: Function }) => {
        if (x === y) {
            return block.fn();
        } else {
            return block.inverse();
        }
    },

    numeral: (x: number, ...str: string[]) => {
        if (x === 1) {
            return str[0];
        } else if (x % 10 >= 2 && x % 10 <= 4) {
            return str[1];
        } else {
            return typeof str[2] === 'string' ? str[2] : str[1];
        }
    }
};
