# Timed field list - choice lists

![Quick appearance](extras/preview-images/quick.png)  
*select_one* with "quick" *appearance*

| numeric | select_one | select_multiple |
| --- | --- | --- |
| <img src="extras/preview-images/numeric.png" alt="numeric" title="numeric" width="100px"/> | <img src="extras/preview-images/select_one.png" alt="select_one" title="select_one" width="100px"/> | <img src="extras/preview-images/select_multiple.png" alt="select_multiple" title="select_multiple" width="100px"/> |

## Description

*Requires at least Android 7 or iOS 13 to work in SurveyCTO Collect mobile.*

Use this field when you would like to time multiple *select_one* and/or *select_multiple* fields within the same field list. within the same [field list](https://docs.surveycto.com/02-designing-forms/04-sample-forms/05.field-lists.html).

If a user attempts to return to a field with this field plug-in that has already been completed, the field will auto-advance (unless parameter 4 is equal to `1` and there was time left, see **Parameters** below).

[![Download now](extras/download-button.png)](https://github.com/surveycto/timed-advance/raw/master/timedadvance.fieldplugin.zip)

## Default SurveyCTO feature support

| Feature / Property | Support |
| --- | --- |
| Supported field type(s) | `select_one`, `select_multiple`|
| Default values | Yes |
| Custom constraint message | Yes |
| Custom required message | Yes |
| Read only | Yes |
| media:image | Yes |
| media:audio | Yes |
| media:video | Yes |
| `label` appearance | Not yet |
| `list-nolabel` appearance | Not yet |
| `quick` appearance | Yes (`select_one` only) |
| `minimal` appearance | Yes (`select_one` only) |
| `compact` appearance | No |
| `compact-#` appearance | No |
| `quickcompact` appearance | No |
| `quickcompact-#` appearance | No |
| `likert` appearance | Yes (`select_one` only) |
| `likert-min` appearance | Yes* (`select_one` only) |
| `likert-mid` appearance | No |

## How to use

**To use this field plug-in as-is**, just download the [timedadvance.fieldplugin.zip](timedadvance.fieldplugin.zip) file from this repo, and attach it to your form.

To create your own field plug-in using this as a template, follow these steps:

1. Fork this repo
1. Make changes to the files in the `source` directory.

    * **Note:** be sure to update the `manifest.json` file as well.

1. Zip the updated contents of the `source` directory.
1. Rename the .zip file to *yourpluginname*.fieldplugin.zip (replace *yourpluginname* with the name you want to use for your field plug-in).
1. You may then attach your new .fieldplugin.zip file to your form as normal.

**Important:** You need to include a choice with the value of `-99`. This choice will be hidden by the field plug-in, but it will be selected if the time runs out without a choice selected.

## Parameters
There are several parameters, but all of them are optional

|**Name**|**Description**|**Default**|
|---|---|---|
|`duration`|Time in seconds before the field auto-advances. No matter what unit is used for parameter 2, you should always enter the duration in seconds.|`10`|
|`unit`|Only needed for the first field in the field list. Unit to be displayed for the time remaining. The time will be shown as the correct converted version. For example, if the start time is 15 seconds, and the unit is `'ms'` for milliseconds, the time will be displayed at the start as `15000`.|`'s'`|
|`disp`|Whether the timer should be displayed or not. Most of the time, this parameter should not be included, since the timer should almost always be displayed. Howerver, if it should not displayed for some reason, such as if it is within a field list, and it is not the top field in a field list, then this parameter should have a value of `0`.|`1`|
|`pass`|The value the field will be given if time runs out before an answer is given.|`-99`|
|`advance`|Whether the field should auto-advance after time runs out. By default (such as if the parameter is not specified), when time runs out, the field will automatically advance, and the enumerator/respondent will not be able to return. If this parameter is equal to `0`, then the field will not auto-advance when time runs out.|`1`|
|`resume`|Whether a respondent can return to a field and continue with the time they have left. For example, if there was 5 seconds remaining when they swiped forward, they can return to that field and work with that remaining 5 seconds. To allow this, give this parameter a value of `1`.|`0`|

For the `unit` parameter, you can use the following display units:

|**Abbr.**|**Full name**|**Unit in 1 second**|
|:---|:---|:---|
|`s`|seconds|1
|`ds`|deciseconds|10
|`cs`|centiseconds|100
|`ms`|milliseconds|1000

For example, if you would like the field to move forward after 20 seconds, you can use this *appearance*:

    custom-timedadvance(duration=20)

If you would like the time to be displayed in milliseconds, you can use this *appearance*:

    custom-timedadvance(duration=20, unit='ms')

If the field is of type *select_one*, you would like it to have the `quick` appearance, and the field should last 15 seconds, you can use this *appearance*:

    quick custom-timedadvance(duration=15)

If you would like the respondent to have 15 seconds to complete the field, but they can return to it later to change their answer with their remaining time, you can use this *appearance*:

    quick custom-timedadvance(duration=15, unit='s', pass=-99, continue=1)

### Working with field lists

This field plug-in works well with field lists. 

#### All fields but the top

Besides the top field, each field should have a `disp` value of `0`. That way, the timer is not shown for each field.

You also don't need the `unit` parameter for these fields. However, it does not hurt to have them.

#### All fields

All fields should have the same `duration` value. To make sure of this, it may be a good idea to store the duration in a field (such as a *calculate* field), and then use a field reference to that field in each `duration` value in the field list. That way, it is easy to keep track of and change the duration of each field in the field list.

## More resources

* **Test form**  
You can find a form definition in this repo here: [extras/test-form](extras/test-form).

* **Developer documentation**  
More instructions for developing and using field plug-ins can be found here: [https://github.com/surveycto/Field-plug-in-resources](https://github.com/surveycto/Field-plug-in-resources)
