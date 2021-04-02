# Using `autoset`

*See the [parameters](https://github.com/surveycto/timed-choice#parameters) in the main readme for an overview. This is a deep explanation of why it is needed, but you don't need to understand why it is needed to use it.*

In a SurveyCTO field plug-in, metadata is not saved until either a field value is set (i.e. the field with the field plug-in is answered), or until the form is saved-and-closed. If this field plug-in is only being used for the timer, meaning there are no choices to select, then an answer will not be set until time actually runs out, meaning metadata will also not be saved until time runs out. If you would like use the time remaining elsewhere in the form (such as if you wanted to display the amount of time remaining), a field value needs to be set. Otherwise, you will not be able to retrieve the time remaining until the form is saved-and-closed.

To get around this, use the `autoset` field plug-in parameter. With this parameter, a field value is set right away. That way, when you go to the next page, the field plug-in metadata will be saved, and you can access the time remaining as soon as you leave that page with the field plug-in.

Keep in mind that until the form instance is saved-and-closed, metadata is only saved once. So, if the enumerator swipes to the next page of the form, then swipes back to the field list with the field plug-in, and the timer continues, the original time will be kept until the form is closed. For example, let's say in your form, one page has a field list with the timed-choice field plug-in, and after that, there is a field that displays how much time is left on the timer. If there are 15 seconds left on the timer, and the enumerator swipes to the next field, that field will show there were 15 seconds remaining. However, if the enumerator swipes back, waits until there are 10 seconds remaining, and then swipes forward again, the field will still say there were 15 seconds remaining. If the enumerator saves their progress, closes the form instance, and then re-opens it, then it will update to say there were 10 seconds remaining.

To avoid this, make sure enumerator do not leave the field until they are ready. Even if they do leave too soon, the correct metadata will still be saved when the form instance is saved-and-closed, so the correct data will be sent to the server.