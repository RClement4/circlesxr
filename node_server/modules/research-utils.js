const fs    = require('fs')

let experimentInProgress    = false;
let trials                  = [];
let currTrialIndex          = -1;
let startSelectTime         = 0;
let logger                  = null;
let num_errors              = 0;

const startExperiment = (data) => {

    //reset
    experimentInProgress    = false;
    trials                  = [];
    currTrialIndex          = -1;
    startSelectTime         = 0;
    logger                  = null;
    num_errors              = 0;

    const date = new Date();
    const fileName =    './downloads/' + 
                        '/FittsSelectExp__' + 
                        date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDay() + '_' +
                        date.getHours() + '-' + date.getMinutes() + '-' + date.getSeconds() + 
                        '__Data.csv';

    //open stream to strat writing data to file
    logger  = fs.createWriteStream(fileName, {
        flags: 'a' // 'a' means appending (old data will be preserved)
    });
    logger.on('finish', () => {
        console.log('file created');
    });
    logger.on('error', (err) => {
        console.log(err.stack);
    });

    logger.write('exp_id, date, time, target_active, targets_x_rot, targets_y_rot, targets_width, targets_depth, targets_radius, targets, num_errors');
    //logger.write('ll, ll, ll, ll, dd, dd, dd, dd, ff, 0.0, 0');
    //logger.end();

    let id, type, targets, targets_x_rots, targets_y_rots, target_widths, target_depths, num_trials = null;
    trials = [];

    const expArr = data.and.tests.data;

    if (expArr.length === 0) {
        console.warn("No Experimental Trials loaded");
    }

    for (let i = 0; i < expArr.length; i++) {
        id              = expArr[i].id;
        type            = expArr[i].type;
        targets         = expArr[i].targets;
        targets_x_rots  = expArr[i].targets_x_rots;
        targets_y_rots  = expArr[i].targets_y_rots;
        targets_widths  = expArr[i].targets_widths;
        targets_depths  = expArr[i].targets_depths;
        num_trials      = expArr[i].num_trials;

        // console.log('id:' + id);
        // console.log('num_targets:' + num_targets);
        // console.log('targets_x_rots:' + targets_x_rots);
        // console.log('targets_y_rots:' + targets_y_rots);
        // console.log('target_widths:' + target_widths);
        // console.log('target_depths:' + target_depths);
        // console.log('num_trials:' + num_trials);

        total_exp_trials = targets_x_rots.length * targets_y_rots.length * targets_widths.length * targets_depths.length * num_trials;
        let exp_trials = [];
        let randIndex = 0;

        //create empty array that we will set each null index randomly to a trial object
        for (let exp_i = 0; exp_i < total_exp_trials; exp_i++) {
            exp_trials.push(null);
        }

        let targetIndex = -1;

        //loop through all possible conditions and add a new trial randomly within trail array
        //wonder if this will perform bad :| Hopefully we can avoid threading for now ...
        for (let xRot_i = 0; xRot_i < targets_x_rots.length; xRot_i++) {
            for (let yRot_i = 0; yRot_i < targets_y_rots.length; yRot_i++) {
                for (let width_i = 0; width_i < targets_widths.length; width_i++) {
                    for (let depth_i = 0; depth_i < targets_depths.length; depth_i++) {
                        for (let trial_i = 0; trial_i < num_trials; trial_i++) {
                            
                            //get random index that hasn't been used yet
                            randIndex = Math.floor(Math.random() * total_exp_trials);
                            while (exp_trials[randIndex] !== null) {
                                randIndex = Math.floor(Math.random() * total_exp_trials);
                            }

                            //choose new index
                            if (++targetIndex === targets.length) {
                                targetIndex = 0;
                            }

                            //create trial
                            const randTrial = CIRCLES.RESEARCH.createExpData();
                            randTrial.target_active     = targets[targetIndex];     //may as well loop through all available targets.
                            randTrial.type              = expArr[i].type;           //knowing what type of select task this is will be useful
                            randTrial.targets           = [].concat(targets);       //all targets visible / cloning array so no weird trouble later
                            randTrial.targets_x_rot     = targets_x_rots[xRot_i];
                            randTrial.targets_y_rots    = targets_y_rots[yRot_i];
                            randTrial.targets_width     = targets_widths[width_i];
                            randTrial.targets_depth     = targets_depths[depth_i];

                            exp_trials[randIndex] = randTrial;  //set null value at this index to the randTrial object
                        }
                    }
                }
            }
        }

        //concat with other experiment trials
        trials = trials.concat(exp_trials);
    }

    experimentInProgress = true;
};

const restartExperiment = () => {
    experimentInProgress = true;
};

const pauseExperiment = (data) => {
    experimentInProgress = false;
};

const unpauseExperiment = (data) => {
    experimentInProgress = true;
};

const stopExperiment = (data) => {
    experimentInProgress    = false;
    trials                  = [];
    currTrialIndex          = -1

    logger.end();
    
    logger                  = null;
    num_errors              = 0;
};

const startSelection = (data) => {
    startSelectTime = Date.now();
};

const stopSelection = (data) => {
    const date = new Date();
    const timeToSelect = date - startSelectTime;
    console.log('Time to select: ' + timeToSelect);
    console.log(getCurrTrial());
    const currTrialObj  = getCurrTrial();
    const expDateStr    = date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0'); + '-' + date.getDay().toString().padStart(2, '0');
    const expTimeStr    = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') + ':' + date.getSeconds().toString().padStart(2, '0') + ':' + date.getMilliseconds().toString().padStart(3, '0');

    //create a string to add
    writeExpdata(   currTrialObj.exp_id,            expDateStr,                 expTimeStr,                 currTrialObj.target_active, 
                    currTrialObj.targets_x_rot,     currTrialObj.targets_y_rot, currTrialObj.targets_width, currTrialObj.targets_depth, 
                    currTrialObj.targets_radius,    currTrialObj.targets,       num_errors );
};

const writeExpdata = (  exp_id,         date,           time,           target_active,  
                        targets_x_rot,  targets_y_rot,  targets_width,  targets_depth,  
                        targets_radius, targets,        num_errors ) => {
    if (logger !== null) {
        const arrTargetsStr = '"[' + targets.join(',') + ']"';
        logger.write(   '\n' +  exp_id + ',' +          date + ',' +            time + ',' +            target_active + ',' + 
                                targets_x_rot + ',' +   targets_y_rot + ',' +   targets_width + ',' +   targets_depth + ',' + 
                                targets_radius + ',' +  arrTargetsStr + ',' +   num_errors );
    }
};

const noteSelectionError = (data) => {
    //end timer
    //write data to file
    num_errors++;
};

const getNextTrial = () => {
    //return null if we went through all trials
    return (++currTrialIndex > trials.length - 1) ? null : trials[currTrialIndex]; //send trial data
};

const getCurrTrial = () => {
    return (currTrialIndex > -1) ? trials[getCurrTrialIndex()] : null;
};

const getCurrTrialIndex = () => {
    return currTrialIndex;
};

const isExperimentInprogress = () => {
    return experimentInProgress;
}

module.exports = {
    startExperiment,
    restartExperiment,
    pauseExperiment,
    unpauseExperiment,
    stopExperiment,
    startSelection,
    stopSelection,
    noteSelectionError,
    getNextTrial,
    getCurrTrial,
    getCurrTrialIndex,
    isExperimentInprogress
  };