YUI.add('gallery-checkboxgroups', function(Y) {

"use strict";

var Direction =
{
	SLIDE_UP:   0,
	SLIDE_DOWN: 1
};

/**********************************************************************
 * <p>Base class for enforcing constraints on groups of checkboxes.</p>
 *
 * <p>Derived classes must override <code>enforceConstraints()</code>.</p>
 * 
 * @module gallery-checkboxgroups
 * @class CheckboxGroup
 * @constructor
 * @param cb_list {String|Object|Array} The list of checkboxes to manage
 */

function CheckboxGroup(
	/* string/object/array */	cb_list)
{
	if (arguments.length === 0)	// derived class prototype
	{
		return;
	}

	this.cb_list = [];
	this.ev_list = [];
	this.splice(0, 0, cb_list);

	this.direction     = Direction.SLIDE_UP;
	this.ignore_change = false;
}

function checkboxChanged(
	/* event */		e,
	/* object */	obj)
{
	this.checkboxChanged(e.target);
}

CheckboxGroup.prototype =
{
	/**
	 * @return {Array} List of managed checkboxes
	 */
	getCheckboxList: function()
	{
		return this.cb_list;
	},

	/**
	 * Same functionality as <code>Array.splice()</code>.  Operates on the
	 * list of managed checkboxes.
	 * 
	 * @param start {Int} Insertion index
	 * @param delete_count {Int} Number of items to remove, starting from <code>start</code>
	 * @param cb_list {String|Object|Array} The list of checkboxes to insert at <code>start</code>
	 */
	splice: function(
		/* int */					start,
		/* int */					delete_count,
		/* string/object/array */	cb_list)
	{
		for (var i=start; i<delete_count; i++)
		{
			this.ev_list[i].detach();
		}

		if (Y.Lang.isString(cb_list))
		{
			var node_list = Y.all(cb_list);

			cb_list = [];
			node_list.each(function(cb)
			{
				this.push(cb);
			},
			cb_list);
		}

		if (cb_list && Y.Lang.isNumber(cb_list.length))
		{
			for (i=0; i<cb_list.length; i++)
			{
				var j=start+i, k=(i===0 ? delete_count : 0);
				this.cb_list.splice(j, k, Y.one(cb_list[i]));
				this.ev_list.splice(j, k, this.cb_list[j].on('click', checkboxChanged, this));
			}
		}
		else
		{
			this.cb_list.splice(start, delete_count);
			this.ev_list.splice(start, delete_count);
		}
	},

	checkboxChanged: function(
		/* checkbox */	cb)
	{
		if (this.ignore_change || !this.cb_list.length || this.allDisabled())
		{
			return;
		}

		cb = Y.one(cb);

		var count = this.cb_list.length;
		for (var i=0; i<count; i++)
		{
			if (cb == this.cb_list[i])
			{
				this.enforceConstraints(this.cb_list, i);
			}
		}
	},

	/**
	 * Derived classes must override this function to implement the desired behavior.
	 * 
	 * @param cb_list {String|Object|Array} The list of checkboxes
	 * @param index {Int} The index of the checkbox that changed
	 */
	enforceConstraints: function(
		/* array */	cb_list,
		/* int */	index)
	{
	},

	/**
	 * @return {boolean} <code>true</code> if all checkboxes are checked
	 */
	allChecked: function()
	{
		var count = this.cb_list.length;
		for (var i=0; i<count; i++)
		{
			if (!this.cb_list[i].get('disabled') && !this.cb_list[i].get('checked'))
			{
				return false;
			}
		}

		return true;
	},

	/**
	 * @return {boolean} <code>true</code> if all checkboxes are unchecked
	 */
	allUnchecked: function()
	{
		var count = this.cb_list.length;
		for (var i=0; i<count; i++)
		{
			if (this.cb_list[i].get('checked'))
			{
				return false;
			}
		}

		return true;
	},

	/**
	 * @return {boolean} <code>true</code> if all checkboxes are disabled
	 */
	allDisabled: function()
	{
		var count = this.cb_list.length;
		for (var i=0; i<count; i++)
		{
			if (!this.cb_list[i].get('disabled'))
			{
				return false;
			}
		}

		return true;
	}
};

Y.CheckboxGroup = CheckboxGroup;
/**********************************************************************
 * At least one checkbox must be selected.  If the last one is turned off,
 * the active, adjacent one is turned on.  The exact algorithm is explained
 * in "Tog on Interface".  The checkboxes are assumed to be ordered in the
 * order they were added.
 * 
 * @module gallery-checkboxgroups
 * @class AtLeastOneCheckboxGroup
 * @constructor
 * @param cb_list {String|Object|Array} The list of checkboxes to manage
 */

function AtLeastOneCheckboxGroup(
	/* string/object/array */	cb_list)
{
	AtLeastOneCheckboxGroup.superclass.constructor.call(this, cb_list);
}

function getNextActiveIndex(
	/* array */	cb_list,
	/* int */	index)
{
	if (cb_list.length < 2)
		{
		return index;
		}

	var new_index = index;
	do
		{
		if (new_index === 0)
			{
			this.direction = Direction.SLIDE_DOWN;
			}
		else if (new_index == cb_list.length-1)
			{
			this.direction = Direction.SLIDE_UP;
			}

		if (this.direction == Direction.SLIDE_UP)
			{
			new_index = Math.max(0, new_index-1);
			}
		else
			{
			new_index = Math.min(cb_list.length-1, new_index+1);
			}
		}
		while (cb_list[new_index].get('disabled'));

	return new_index;
}

Y.extend(AtLeastOneCheckboxGroup, CheckboxGroup,
{
	enforceConstraints: function(
		/* array */	cb_list,
		/* int */	index)
	{
		if (cb_list[index].get('checked') || !this.allUnchecked())
		{
			this.direction = Direction.SLIDE_UP;
			return;
		}

		// slide to the adjacent checkbox, skipping over disabled ones

		var new_index = getNextActiveIndex.call(this, cb_list, index);
		if (new_index == index)											// may have hit the end and bounced back
			{
			new_index = getNextActiveIndex.call(this, cb_list, index);	// if newID == id, then there is only one enabled
			}

		// turn the new checkbox on

		this.ignore_change = true;
		cb_list[new_index].set('checked', true);
		this.ignore_change = false;
	}
});

Y.AtLeastOneCheckboxGroup = AtLeastOneCheckboxGroup;
/**********************************************************************
 * At most one checkbox can be selected.  If one is turned on, the active
 * one is turned off.
 * 
 * @module gallery-checkboxgroups
 * @class AtMostOneCheckboxGroup
 * @constructor
 * @param cb_list {String|Object|Array} The list of checkboxes to manage
 */

function AtMostOneCheckboxGroup(
	/* string/object/array */	cb_list)
{
	AtMostOneCheckboxGroup.superclass.constructor.call(this, cb_list);
}

Y.extend(AtMostOneCheckboxGroup, CheckboxGroup,
{
	enforceConstraints: function(
		/* array */	cb_list,
		/* int */	index)
	{
		if (!cb_list[index].get('checked'))
		{
			return;
		}

		var count = cb_list.length;
		for (var i=0; i<count; i++)
		{
			if (i != index)
			{
				cb_list[i].set('checked', false);
			}
		}
	}
});

Y.AtMostOneCheckboxGroup = AtMostOneCheckboxGroup;
/**********************************************************************
 * All checkboxes can be selected and a select-all checkbox is available
 * to check all. This check-all box is automatically changed if any other
 * checkbox changes state.
 * 
 * @module gallery-checkboxgroups
 * @class SelectAllCheckboxGroup
 * @constructor
 * @param select_all_cb {String|Object} The checkbox that triggers "select all"
 * @param cb_list {String|Object|Array} The list of checkboxes to manage
 */

function SelectAllCheckboxGroup(
	/* string/object */			select_all_cb,
	/* string/object/array */	cb_list)
{
	this.select_all_cb = Y.one(select_all_cb);
	this.select_all_cb.on('click', this.toggleSelectAll, this);

	SelectAllCheckboxGroup.superclass.constructor.call(this, cb_list);
}

Y.extend(SelectAllCheckboxGroup, CheckboxGroup,
{
	getSelectAllCheckbox: function()
	{
		return this.select_all_cb;
	},

	toggleSelectAll: function()
	{
		var checked = this.select_all_cb.get('checked');
		for (var i=0; i<this.cb_list.length; i++)
		{
			if (!this.cb_list[i].get('disabled'))
			{
				this.cb_list[i].set('checked', checked);
			}
		}
	},

	enforceConstraints: function(
		/* array */	cb_list,
		/* int */	index)
	{
		this.select_all_cb.set('checked', this.allChecked());
	}
});

Y.SelectAllCheckboxGroup = SelectAllCheckboxGroup;


}, 'gallery-2010.05.26-19-47' ,{requires:['node-base']});
