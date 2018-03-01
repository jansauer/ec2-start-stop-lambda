'use strict';

// const AWSXRay = require('aws-xray-sdk');
// const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const AWS = require('aws-sdk');
const ec2 = new AWS.EC2();
const parser = require('cron-parser');
const moment = require('moment');

const startExpressionTag = process.env.START_EXPRESSION_TAG
const stopExpressionTag = process.env.STOP_EXPRESSION_TAG
const graceTime = process.env.GRACE_TIME_MINUTES

exports.handler = (event, context, callback) => {
  ec2.describeInstances({
    Filters: [{
      Name: 'tag-key',
      Values: [
        startExpressionTag,
        stopExpressionTag
      ]
    }]
  }, function(error, data) {
    if (error) callback(error);
    data.Reservations.forEach(function(reservation) {
      reservation.Instances.forEach(function(instance) {

        // Check if instance should be started
        let startexpression = instance.Tags.find(function(element) {
          return element.Key == startExpressionTag;
        });
        if (startexpression && instance.State.Name == 'stopped') {
          try {
            var interval = parser.parseExpression(startexpression.Value);
            console.log('Found start expression \'%s\' on stopped instance \'%s\'',
                startexpression.Value, instance.InstanceId);
            let prev = interval.prev().toDate();
            if (moment().isBetween(moment(prev), moment(prev).add(graceTime, 'm'))) {
              console.log('Instance \'%s\' should be started as of \'%s\'',
                  instance.InstanceId, prev);
              ec2.startInstances({
                InstanceIds: [ instance.InstanceId ]
              }, function(error, data) {
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
        let stopexpression = instance.Tags.find(function(element) {
          return element.Key == stopExpressionTag;
        });
        if (stopexpression && instance.State.Name == 'running') {
          try {
            var interval = parser.parseExpression(stopexpression.Value);
            console.log('Found stop expression \'%s\' on running instance \'%s\'',
                stopexpression.Value, instance.InstanceId);
            let prev = interval.prev().toDate();
            if (moment().isBetween(moment(prev), moment(prev).add(graceTime, 'm'))) {
              console.log('Instance \'%s\' should be stopped as of \'%s\'',
                  instance.InstanceId, prev);
              ec2.stopInstances({
                InstanceIds: [ instance.InstanceId ]
              }, function(error, data) {
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
}
