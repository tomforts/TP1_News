const periodicRefreshPeriod = 10;
let categories = [];
let selectedCategory = "";
let currentETag = "";
let hold_Periodic_Refresh = false;
let pageManager;
let itemLayout;

//let isUpdating = false;
let waiting = null;
let waitingGifTrigger = 2000;

function addWaitingGif() {
    clearTimeout(waiting);
    waiting = setTimeout(() => {
        $("#itemsPanel").append($("<div id='waitingGif' class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>"));
    }, waitingGifTrigger)
}
function removeWaitingGif() {
    clearTimeout(waiting);
    $("#waitingGif").remove();
}

Init_UI();

async function Init_UI() {
    itemLayout = {
        width: $("#sample").outerWidth(),
        height: $("#sample").outerHeight()
    };
    pageManager = new PageManager('scrollPanel', 'itemsPanel', itemLayout, renderNews);
    compileCategories();
    $('#createNews').on("click", async function () {
        renderCreateNewsForm();
    });
    $('#abort').on("click", async function () {
        showNews()
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
    showNews();
    //this makes the page go all the way up once reaching the bottom
    start_Periodic_Refresh();
}
function showNews() {
    $("#actionTitle").text("Liste de nouvelles");
    $("#scrollPanel").show();
    $('#abort').hide();
    $('#NewsForm').hide();
    $('#aboutContainer').hide();
    $("#createNews").show();
    hold_Periodic_Refresh = false;
}
function hideNews() {
    $("#scrollPanel").hide();
    $("#createNews").hide();
    $("#abort").show();
    hold_Periodic_Refresh = true;
}

function start_Periodic_Refresh() {
    setInterval(async () => {
            if (!hold_Periodic_Refresh) {
                let etag = await Bookmarks_API.HEAD();
                if (currentETag != etag) {
                    currentETag = etag;
                    await pageManager.update(false);
                    compileCategories();
                }
            }
        },
        periodicRefreshPeriod * 1000);

    // document.getElementById('scrollPanel').addEventListener('scroll', async function() {
    //     const scrollPanel = document.getElementById('scrollPanel');
    //     if (scrollPanel.scrollTop + scrollPanel.clientHeight >= scrollPanel.scrollHeight) {
    //         let etag = await News_API.HEAD();
    //         if (currentETag != etag) {
    //             currentETag = etag;
    //             await pageManager.update(false);
    //         }
    //     }
    // });
}

function renderAbout() {
    hideNews();
    $("#actionTitle").text("À propos...");
    $("#aboutContainer").show();
}
function updateDropDownMenu() {
    let DDMenu = $("#DDMenu");
    let selectClass = selectedCategory === "" ? "fa-check" : "fa-fw";
    DDMenu.empty();
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="allCatCmd">
            <i class="menuIcon fa ${selectClass} mx-2"></i> Toutes les catégories
        </div>
        `));
    DDMenu.append($(`<div class="dropdown-divider"></div>`));
    categories.forEach(category => {
        selectClass = selectedCategory === category ? "fa-check" : "fa-fw";
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout category" id="allCatCmd">
                <i class="menuIcon fa ${selectClass} mx-2"></i> ${category}
            </div>
        `));
    })
    DDMenu.append($(`<div class="dropdown-divider"></div> `));
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>
        `));
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
    $('#allCatCmd').on("click", function () {
        showNews();
        selectedCategory = "";
        updateDropDownMenu();
        pageManager.reset();
    });
    $('.category').on("click", function () {
        showNews();
        selectedCategory = $(this).text().trim();
        updateDropDownMenu();
        pageManager.reset();
    });
}
async function compileCategories() {
    categories = [];
    let response = await News_API.GetQuery("?fields=category&sort=category");
    if (!News_API.error) {
        let items = response.data;
        if (items != null) {
            items.forEach(item => {
                if (!categories.includes(item.Category))
                    categories.push(item.Category);
            })
            updateDropDownMenu(categories);
        }
    }
}
async function renderNews(queryString) {
    let endOfData = false;
    queryString += "&sort=category";
    if (selectedCategory != "") queryString += "&category=" + selectedCategory;
    addWaitingGif();
    let response = await News_API.GetQuery(queryString);
    if (!News_API.error) {
        currentETag = response.ETag;
        let News = response.data;
        if (News.length > 0) {
            News.sort((a, b) => new Date(b.Creation) - new Date(a.Creation));

            //$("#itemsPanel").empty();
            News.forEach(news => {
                $("#itemsPanel").append(renderNew(news));
            });
            $(".editCmd").off();
            $(".editCmd").on("click", function () {
                renderEditNewsForm($(this).attr("editNewsId"));
            });
            $(".deleteCmd").off();
            $(".deleteCmd").on("click", function () {
                renderDeleteNewsForm($(this).attr("deleteNewsId"));
            });
        } else
            endOfData = true;
    } else {
        renderError(News_API.currentHttpError);
    }
    removeWaitingGif();
    return endOfData;
}

function renderError(message) {
    hideNews();
    $("#actionTitle").text("Erreur du serveur...");
    $("#errorContainer").show();
    $("#errorContainer").append($(`<div>${message}</div>`));
}
function renderCreateNewsForm() {
    renderNewsForm();
}
async function renderEditNewsForm(id) {
    addWaitingGif();
    let response = await News_API.Get(id)
    if (!News_API.error) {
        let News = response.data;
        if (News !== null)
            renderNewsForm(News);
        else
            renderError("Nouvelle introuvable!");
    } else {
        renderError(News_API.currentHttpError);
    }
    removeWaitingGif();
}
async function renderDeleteNewsForm(id) {
    hideNews();
    $("#actionTitle").text("Retrait");
    $('#newsForm').show();
    $('#newsForm').empty();
    let response = await News_API.Get(id)
    if (!News_API.error) {
        let News = response.data;
        if (News !== null) {
            $("#newsForm").append(`
        <div class="NewsdeleteForm">
            <h4>Effacer la nouvelle suivante?</h4>
            <br>
            <div class="NewsRow" id=${News.Id}">
                <div class="NewsContainer noselect">
                    <div class="NewsLayout">
                        <div class="News">
                            <a href="" target="_blank"></a>
                            <span class="NewsTitle">${News.Title}</span>
                        </div>
                        <span class="NewsCategory">${News.Category}</span>
                    </div>
                    <div class="NewsCommandPanel">
                        <span class="editCmd cmdIcon fa fa-pencil" editNewsId="${News.Id}" title="Modifier ${News.Title}"></span>
                        <span class="deleteCmd cmdIcon fa fa-trash" deleteNewsId="${News.Id}" title="Effacer ${News.Title}"></span>
                    </div>
                </div>
            </div>   
            <br>
            <input type="button" value="Effacer" id="deleteNews" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
            $('#deleteNews').on("click", async function () {
                await News_API.Delete(News.Id);
                if (!News_API.error) {
                    showNews();
                    await pageManager.update(false);
                    compileCategories();
                }
                else {
                    console.log(News_API.currentHttpError)
                    renderError("Une erreur est survenue!");
                }
            });
            $('#cancel').on("click", function () {
                showNews();
            });

        } else {
            renderError("Nouvelle introuvable!");
        }
    } else
        renderError(News_API.currentHttpError);
}
function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}
function newNews() {
    News = {};
    News.Title = "";
    News.Text = "";
    News.Category = "";
    return News;
}
function renderNewsForm(News = null) {
    hideNews();
    let create = News == null;
    if (create) {
        News = newNews();
        News.Image = "images/no-avatar.png";
    }

    $("#actionTitle").text(create ? "Création" : "Modification");
    $("#newsForm").show();
    $("#newsForm").empty();
    $("#newsForm").append(`
        <form class="form" id="NewsForm">
            <input type="hidden" name="Id" value="${News.Id}"/>

            <label for="Title" class="form-label">Titre </label>
            <input 
                class="form-control Alpha"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le titre comporte un caractère illégal"
                value="${News.Title}"
            />
            <label for="Category" class="form-label">Catégorie </label>
            <input 
                class="form-control"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                value="${News.Category}"
            />
            <label for="Text" class="form-label">Texte </label>
            <input 
                class="form-control"
                name="Text"
                id="Text"
                placeholder="Text"
                required
                value="${News.Text}"
            />
           <label class="form-label">Image </label>
            <div   class='imageUploader' 
                   newImage='${create}' 
                   controlId='Image' 
                   imageSrc='${News.Image}' 
                   waitingImage="Loading_icon.gif">
            </div>
            <hr>
            <input type="submit" value="Enregistrer" id="saveNews" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initImageUploaders();
    initFormValidation();
    $('#NewsForm').on("submit", async function (event) {
        event.preventDefault();
        let News = getFormData($("#NewsForm"));
        News.Creation = Date.now();
        News = await News_API.Save(News, create);
        if (!News_API.error) {
            showNews();
            await pageManager.update(false);
            compileCategories();
            pageManager.scrollToElem(News.Id);
        }
        else
            renderError("Une erreur est survenue!");
    });
    $('#cancel').on("click", function () {
        showNews();
    });
}

function renderNew(News) {
    //const formattedText = News.Text.replace("/\n/g", "<br>");

    return $(`
     <div class="NewsRow" id='${News.Id}'>
        <div class="NewsContainer noselect">
            <div class="NewsLayout">
                <div class="News">
                    <a href="#" class="NewsCategory" data-category="${News.Category}">${News.Category}</a>
                </div>
                    <span class="NewsTitle">${News.Title}</span>
                <div class="NewsImage" style="background-image:url('${News.Image}')"></div>
                <span class="NewsDate">${convertToFrenchDate(News.Creation)}</span>
                <span class="NewsText">${News.Text}</span>
            </div>
            <div class="NewsCommandPanel">
                <span class="editCmd cmdIcon fa fa-pencil" editNewsId="${News.Id}" title="Modifier ${News.Title}"></span>
                <span class="deleteCmd cmdIcon fa fa-trash" deleteNewsId="${News.Id}" title="Effacer ${News.Title}"></span>
            </div>
        </div>
    </div>           
    `);
}

function convertToFrenchDate(numeric_date) {
    date = new Date(numeric_date);
    var options = { year: 'numeric', month: 'long', day: 'numeric' };
    var opt_weekday = { weekday: 'long' };
    var weekday = toTitleCase(date.toLocaleDateString("fr-FR", opt_weekday));

    function toTitleCase(str) {
        return str.replace(
            /\w\S*/g,
            function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    }
    return weekday + " le " + date.toLocaleDateString("fr-FR", options) + " @ " + date.toLocaleTimeString("fr-FR");
}

function updateSelectedCategoryDisplay() {
    const displayElement = $("#selectedCategoryDisplay");
    displayElement.empty();
    if (selectedCategory != "") {
        displayElement.append('<a class="fa-solid fa-house" href="index.html"> </a>');
        displayElement.append(` >> ${selectedCategory}`);
    }
}

$(document).on("click", ".NewsCategory", function (event){
    event.preventDefault();
    selectedCategory = $(this).data("category");
    updateDropDownMenu();
    pageManager.reset();
    updateSelectedCategoryDisplay();
    renderNews();
});

$('#allCatCmd').on("click", function () {
    showNews();
    selectedCategory = "";
    updateDropDownMenu();
    pageManager.reset();
    updateSelectedCategoryDisplay();
});

$('.category').on("click", function () {
    showNews();
    selectedCategory = $(this).text().trim();
    updateDropDownMenu();
    pageManager.reset();
    updateSelectedCategoryDisplay();
});

document.getElementById('searchBar').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('searchNews').click();
    }
});

document.getElementById('searchNews').addEventListener('click', async function() {
    const searchBar = document.getElementById('searchBar');
    const searchString = searchBar.value.toLowerCase();

    let response = await News_API.GetQuery();
    if (!News_API.error) {
        const newsItems = response.data;

        const filteredNews = newsItems.filter(newsItem => {
            const title = newsItem.Title.toLowerCase();
            const text = newsItem.Text.toLowerCase();
            return title.includes(searchString) || text.includes(searchString);
        });

        $("#itemsPanel").empty();
        filteredNews.forEach(news => {
            $("#itemsPanel").append(renderNew(news));
        });

        $(".editCmd").off();
        $(".editCmd").on("click", function () {
            renderEditNewsForm($(this).attr("editNewsId"));
        });
        $(".deleteCmd").off();
        $(".deleteCmd").on("click", function () {
            renderDeleteNewsForm($(this).attr("deleteNewsId"));
        });
    } else {
        renderError(News_API.currentHttpError);
    }
});