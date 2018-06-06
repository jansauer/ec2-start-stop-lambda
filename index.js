'use strict';

// const AWSXRay = require('aws-xray-sdk');
// const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const AWS = require('aws-sdk');
const ec2 = new AWS.EC2();
const parser = require('cron-parser');
const moment = require('moment');
const momentTimezone = require('moment-timezone');


const startExpressionTag = process.env.START_EXPRESSION_TAG;
const stopExpressionTag = process.env.STOP_EXPRESSION_TAG;
const graceTime = process.env.GRACE_TIME_MINUTES;
const timezone = process.env.TIMEZONE ? process.env.TIMEZONE : 'Europe/Berlin';

exports.handler = (event, context, callback) => {
    ec2.describeInstances({
        Filters: [{
            Name: 'tag-key',
            Values: [
                startExpressionTag,
                stopExpressionTag
            ]
        }]
    }, function (error, data) {
        if (error) callback(error);

        console.log('setting timezone ', timezone);
        moment.tz.setDefault(timezone);

        data.Reservations.forEach(function (reservation) {
            reservation.Instances.forEach(function (instance) {

                // Check if instance should be started
                let startexpression = instance.Tags.find(function (element) {
                    return element.Key == startExpressionTag;
                });
                if (startexpression && instance.State.Name == 'stopped') {
                    try {
                        console.log('Found start expression \'%s\' on stopped instance \'%s\'', startexpression.Value, instance.InstanceId);

                        if (isCurrentTimeAffectedByCron(startexpression)) {
                            console.log('Instance \'%s\' should be started as of \'%s\'', instance.InstanceId);
                            ec2.startInstances({
                                InstanceIds: [instance.InstanceId]
                            }, function (error, data) {
                                if (error) callback(error);
                                console.log('Instance \'%s\' is now \'%s\'',
                                    data.StartingInstances[0].InstanceId, data.StartingInstances[0].CurrentState.Name);
                            });
                        }
                    } catch (error) {
                        console.log('Unable to parse start expression \'%s\' on stopped instance \'%s\'',
                            startexpression.Value, instance.InstanceId);
                    }
                }

                // Check if instance should be stopped
                let stopexpression = instance.Tags.find(function (element) {
                    return element.Key == stopExpressionTag;
                });
                if (stopexpression && instance.State.Name == 'running') {
                    try {
                        console.log('Found stop expression \'%s\' on running instance \'%s\'', stopexpression.Value, instance.InstanceId);

                        if (isCurrentTimeAffectedByCron(stopexpression)) {
                            console.log('Instance \'%s\' should be stopped as of \'%s\'', instance.InstanceId);
                            ec2.stopInstances({
                                InstanceIds: [instance.InstanceId]
                            }, function (error, data) {
                                if (error) callback(error);
                                console.log('Instance \'%s\' is now \'%s\'',
                                    data.StoppingInstances[0].InstanceId, data.StoppingInstances[0].CurrentState.Name);
                            });
                        }
                    } catch (error) {
                        console.log('Unable to parse stop expression \'%s\' on running instance \'%s\'',
                            stopexpression.Value, instance.InstanceId);
                    }
                }

            });
        });
    });
};

function isCurrentTimeAffectedByCron(expression) {
    const interval = parser.parseExpression(expression.Value);
    const previousCronFire = interval.prev();

    let prev = moment(previousCronFire.toDate());
    let prevWithGrace = moment(previousCronFire.toDate()).add(graceTime, 'm');

    console.log('Is ', moment(), ' between ', prev, ' and ', prevWithGrace, ' = ', moment().isBetween(prev, prevWithGrace));
    return moment().isBetween(prev, prevWithGrace);
}
