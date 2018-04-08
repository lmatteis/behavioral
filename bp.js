/**
 * BP implementation for Javascript 1.7 (Mozilla)
 */

Array.prototype.isEmpty = function() {
    return this.length == 0;
};

Array.prototype.notEmpty = function() {
    return this.length > 0;
};

function compareBids(a, b) {
    return a.priority - b.priority;
}

function BProgram() {
    this.running = [];
    this.pending = [];
    this.lastEvent = undefined;
    this.disabled = []; // List of currently disabled elements
}

BProgram.prototype.addBThread = function(name, prio, fun) {
    var bt = fun(); // Activate the generator
    var bid = {name: name, priority: prio, bthread: bt};
    this.running.push(bid);
};

BProgram.prototype.addAll = function(bthreads, priorities) {
    for (var name in bthreads) {
        var fun = bthreads[name];
        var prio = priorities[name];
        this.addBThread(name, prio, fun);
    }
};

BProgram.prototype.event = function(e) {
    var name = 'request ' + e;
    var bt = function* () {
        yield {request: [e], wait: [function(x) { return true; }]}
    };
    this.addBThread(name, 1, bt);
    this.run(); // Initiate super-step
};

BProgram.prototype.run = async function() {
    if (this.running.isEmpty()) {
        return; // TODO: Test end-case of empty current list
    }
    while (this.running.notEmpty()) {
        var bid = this.running[0];
        var bt = bid.bthread;
        try {
            var newbid = bt.next(this.lastEvent).value; // Run an iteration of the generator
            if (Promise.resolve(newbid) == newbid) {
              const ret = await newbid // think of it as a promise
              this.lastEvent = ret // so we access the data: var foo = yield promise()
              return this.run()
            }
            this.running.shift()
            newbid.bthread = bt; // Bind the bthread to the bid for running later
            newbid.priority = bid.priority; // Keep copying the prio
            newbid.name = bid.name; // Keep copying the name
            this.pending.push(newbid);
        } catch (e) {
            // This is normal - the bthread has finished.
        }
    }
    // End of current step
    this.selectNextEvent();
    if (this.lastEvent) {
        // There is an actual last event selected
        var temp = [];
        while (this.pending.notEmpty()) {
            bid = this.pending.shift();
            var r = bid.request ? bid.request : [];
            var w = bid.wait    ? bid.wait    : [];
            var waitlist = r.concat(w);
            var cur = false;
            for (var i=0; i<waitlist.length; i++) {
                var waiting = waitlist[i];
                if (waiting == this.lastEvent ||
                    (typeof(waiting) == 'function' && waiting(this.lastEvent))
                ) {
                    cur = true;
                }
            }
            if (cur && bid.bthread) {
                this.running.push(bid);
            } else {
                temp.push(bid);
            }
        }
        this.pending = temp;
        this.run()
    } else {
        // Nothing was selected - end of super-step
        this.lastEvent = undefined; // Gotcha: null is not the same as undefined
        //this.disableBlockedEvents();
    }
};

BProgram.prototype.selectNextEvent = function() {
    var i,j,k;
    var candidates = [];
    var events = [];
    for (i=0; i<this.pending.length; i++) {
        var bid = this.pending[i];
        if (bid.request) {
            for (j=0; j<bid.request.length; j++) {
                var e = bid.request[j];
                var c = {priority: bid.priority, event: e};
                candidates.push(c);
            }
        }
    }
    for (i=0; i<candidates.length; i++) {
        var candidate = candidates[i];
        var ok = true;
        for (j=0; j<this.pending.length; j++) {
            bid = this.pending[j];
            if (bid.block) {
                for (k=0; k<bid.block.length; k++) {
                    var blocked = bid.block[k];
                    e  = candidate.event;
                    if (e == blocked ||
                        (typeof(blocked) == 'function' && blocked(e))
                    ) {
                        ok = false;
                    }
                }
            }
        }
        if (ok) {
            events.push(candidate);
        }
    }
    if (events.length > 0) {
        events.sort(compareBids);
        this.lastEvent = events[0].event;
    } else {
        this.lastEvent = null;
    }
};

BProgram.prototype.handlerNames = [
    'onload', 'onunload', 'onblur', 'onchange', 'onfocus', 'onreset', 'onselect', 'onsubmit',
    'onabort', 'onkeydown', 'onkeypress', 'onkeyup', 'onclick', 'ondblclick',
    'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup'];

BProgram.prototype.disableBlockedEvents = function() {
    var blocked = [];
    var flipped = [];
    for (var p = 0; p < this.pending.length; p++) {
        var bid = this.pending[p];
        if (bid.block) {
            blocked = blocked.concat(bid.block);
        }
    }
    // Disable blocked elements
    for (var i = 0; i < this.handlerNames.length; i++) {
        for (var j=0; j < blocked.length; j++) {
            var name = this.handlerNames[i];
            var event = blocked[j];
            var expr = "//*[@" + name + "=\"bp.event('" + event + "');\"]";
            var elems = document.evaluate(expr, document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
            var elem = elems.iterateNext();
            while (elem) {
                var e = elem;
                elem = elems.iterateNext();
                e.disabled = true;
                flipped.push(e);
            }
        }
    }
    // Release disabled but not blocked elements
    var regexp = /bp\.event\(['"](.*)['"]\);/;
    for (var k=0; k < this.disabled.length; k++) {
        var ok = true;
        var dis_elem = this.disabled[k];
        for (i = 0; i < this.handlerNames.length; i++) {
            name = this.handlerNames[i];
            var val = dis_elem[name];
            var match = regexp.exec(val);
            if (match && match[1]) {
                var evtname = match[1];
                for (j=0; j < blocked.length; j++) {
                    event = blocked[j];
                    if (event == evtname) {
                        ok = false;
                    }
                }
            }
        }
        dis_elem.disabled = !ok;
    }
    // Flip the lists
    this.disabled = flipped;
};

exports.default = BProgram
