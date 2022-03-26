const aws = require('aws-sdk');
const codedeploy = new aws.CodeDeploy({apiVersion: '2014-10-06'});
const lambda = new aws.Lambda();

exports.handler = (event, context, callback) => {

    //Read the DeploymentId from the event payload.
    let deploymentId = event.DeploymentId;

    //Read the LifecycleEventHookExecutionId from the event payload
    let lifecycleEventHookExecutionId = event.LifecycleEventHookExecutionId;

    let functionToTest = process.env.NewVersion;
    console.log("Testing new function version: " + functionToTest);

    // Perform validation of the newly deployed Lambda version
    let lambdaParams = {
        FunctionName: functionToTest,
        InvocationType: "RequestResponse"
    };

    let lambdaResult = "Failed";

    lambda.invoke(lambdaParams, function (err, data) {
        if (err) {
            console.log(err, err.stack);
            lambdaResult = "Failed";
        } else {
            let result = JSON.parse(data.Payload);
            console.log("Result: " + JSON.stringify(result));

            if (result.body > 5) {
                lambdaResult = "Succeeded";
                console.log("Validation testing succeeded!");
            } else {
                lambdaResult = "Failed";
                console.log("Validation testing failed!");
            }

            // Complete the PreTraffic Hook by sending CodeDeploy the validation status
            let params = {
                deploymentId: deploymentId,
                lifecycleEventHookExecutionId: lifecycleEventHookExecutionId,
                status: lambdaResult // status can be 'Succeeded' or 'Failed'
            };

            // Pass AWS CodeDeploy the prepared validation test results.
            codedeploy.putLifecycleEventHookExecutionStatus(params, function (err) {
                if (err) {
                    console.log('CodeDeploy Status update failed');
                    console.log(err, err.stack);
                    callback("CodeDeploy Status update failed");
                } else {
                    console.log('Codedeploy status updated successfully');
                    callback(null, 'Codedeploy status updated successfully');
                }
            });
        }
    });
}