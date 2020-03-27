export default {
    times: (n: Number, block: { fn: Function }) => { // TODO: @pchecinski maybe we should use array function like "map" here instead
        let accum = '';
        for (let i = 1; i <= n; i++) {
            accum += block.fn(i);
        }
        return accum;
    },

    check: (x: Number, y: Number, block: any) => {
        if(x === y) {
            return block.fn();
        }
    }
};
